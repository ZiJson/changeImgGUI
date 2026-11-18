// electron-builder 的 GitHub publisher 會平行建立 release。
// 同一個 tag 會出現兩筆，setup.exe、latest.yml 和 blockmap 可能被拆開。
// 這裡改成先建置，再對同一個 release 依序上傳，檔案齊全後才公開。
import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  createReadStream,
  existsSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync
} from 'node:fs'
import { request as httpsRequest } from 'node:https'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist')
const retry = process.argv.includes('--retry')

export function artifactNames(packageName, version) {
  const exe = `${packageName}-${version}-setup.exe`
  return {
    exe,
    blockmap: `${exe}.blockmap`,
    latest: 'latest.yml'
  }
}

export function requiredAssetNames(packageName, version) {
  const names = artifactNames(packageName, version)
  return [names.exe, names.blockmap, names.latest]
}

export function buildLatestYml({ version, fileName, sha512, size, releaseDate }) {
  return [
    `version: ${version}`,
    'files:',
    `  - url: ${fileName}`,
    `    sha512: ${sha512}`,
    `    size: ${size}`,
    `path: ${fileName}`,
    `sha512: ${sha512}`,
    `releaseDate: '${releaseDate}'`,
    ''
  ].join('\n')
}

export function chooseKeeper(releases) {
  if (releases.length === 0) return null
  const drafts = releases.filter((release) => release.draft)
  const pool = drafts.length > 0 ? drafts : releases
  return pool.reduce((newest, release) => (release.id > newest.id ? release : newest))
}

export function parseCommitLog(log) {
  return log
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const tab = line.indexOf('\t')
      if (tab === -1) return { hash: '', subject: line }
      return { hash: line.slice(0, tab), subject: line.slice(tab + 1) }
    })
}

export function buildReleaseNotes({ previousTag, tag, commits, compareUrl }) {
  const heading = previousTag ? `自 ${previousTag} 以來的改動` : `${tag} 的改動`
  const items =
    commits.length > 0
      ? commits.map((commit) =>
          commit.hash ? `- ${commit.hash} ${commit.subject}` : `- ${commit.subject}`
        )
      : ['沒有新的 commit。']
  const lines = [`## ${heading}`, '', ...items]
  if (compareUrl) lines.push('', `完整比較：${compareUrl}`)
  return `${lines.join('\n')}\n`
}

export function isTagFullyPublished(releases, assetNames) {
  if (releases.length !== 1 || releases[0]?.draft) return false
  const names = new Set((releases[0].assets ?? []).map((asset) => asset.name))
  return assetNames.every((name) => names.has(name))
}

const releaseLevels = {
  1: 'patch',
  2: 'minor',
  3: 'major',
  patch: 'patch',
  minor: 'minor',
  major: 'major',
  小: 'patch',
  中: 'minor',
  大: 'major',
  小版本: 'patch',
  中版本: 'minor',
  大版本: 'major'
}

const levelLabel = {
  patch: '小版本',
  minor: '中版本',
  major: '大版本'
}

export function parseReleaseLevel(args) {
  const found = []
  const unknown = []
  for (const arg of args) {
    if (arg === '--' || arg === '--retry') continue
    const level = releaseLevels[arg.replace(/^--/, '')]
    if (level) found.push(level)
    else unknown.push(arg)
  }
  if (unknown.length > 0) {
    fail(`無法辨識參數：${unknown.join(' ')}。請用 小、中、大，或 patch、minor、major`)
  }
  if (found.length > 1) fail('只能選一種版本：大、中或小')
  return found[0] ?? null
}

export function bumpVersion(version, level) {
  const match = /^(\d+)\.(\d+)\.(\d+)/.exec(version)
  if (!match || !releaseLevels[level]) fail(`無法解析版本號：${version}`)
  let [, major, minor, patch] = match
  major = Number(major)
  minor = Number(minor)
  patch = Number(patch)
  if (level === 'major') return `${major + 1}.0.0`
  if (level === 'minor') return `${major}.${minor + 1}.0`
  return `${major}.${minor}.${patch + 1}`
}

async function askReleaseLevel(version) {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const answer = (
      await rl.question(
        [
          `目前版本 ${version}，要升哪一個？`,
          `  1) 小版本  ${bumpVersion(version, 'patch')}`,
          `  2) 中版本  ${bumpVersion(version, 'minor')}`,
          `  3) 大版本  ${bumpVersion(version, 'major')}`,
          '請輸入 [1]: '
        ].join('\n')
      )
    ).trim()
    const level = parseReleaseLevel([answer || '1'])
    if (!level) fail(`無法辨識「${answer}」，請輸入 1、2、3 或 小、中、大`)
    return level
  } finally {
    rl.close()
  }
}

async function resolveReleaseLevel(version) {
  const selected = parseReleaseLevel(process.argv.slice(2))
  if (selected) return selected
  if (!process.stdin.isTTY) return 'patch'
  return askReleaseLevel(version)
}

class GitHubError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

function fail(message) {
  throw new Error(message)
}

function run(command, args) {
  console.log(`> ${command} ${args.join(' ')}`)
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: process.platform === 'win32'
  })
  if (result.error) throw result.error
  if (result.status !== 0) fail(`${command} 結束代碼 ${result.status}`)
}

function gitOutput(args) {
  const result = spawnSync('git', args, { cwd: root, encoding: 'utf8' })
  if (result.status !== 0) {
    fail(result.stderr?.trim() || `git ${args.join(' ')} 失敗`)
  }
  return result.stdout.trim()
}

function readPackage() {
  return JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
}

function repoFromPackage(pkg) {
  const url = new URL(pkg.homepage)
  const [owner, repo] = url.pathname.split('/').filter(Boolean)
  if (url.hostname !== 'github.com' || !owner || !repo) {
    fail(`package.json homepage 不是 GitHub repo：${pkg.homepage}`)
  }
  return { owner, repo: repo.replace(/\.git$/, '') }
}

function githubToken() {
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN || ''
  if (!token.trim()) {
    fail('請先設定 GH_TOKEN 或 GITHUB_TOKEN，這個 token 需要 repo 權限')
  }
  return token.trim()
}

function githubRequest({ method, url, token, headers, body, timeout = 120_000 }) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const req = httpsRequest(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method,
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'changeimggui-release',
          'X-GitHub-Api-Version': '2022-11-28',
          ...headers
        },
        timeout
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          const contentType = res.headers['content-type'] || ''
          const parsed = text && contentType.includes('json') ? parseBody(text) : text
          resolve({ status: res.statusCode ?? 0, body: parsed })
        })
      }
    )
    req.on('timeout', () => {
      req.destroy(new GitHubError('GitHub 請求逾時', 0))
    })
    req.on('error', reject)
    if (body == null) {
      req.end()
      return
    }
    if (typeof body.pipe === 'function') {
      body.pipe(req)
      return
    }
    const payload = typeof body === 'string' || Buffer.isBuffer(body) ? body : JSON.stringify(body)
    req.end(payload)
  })
}

function parseBody(text) {
  if (!text) return text
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function githubMessage(body) {
  if (body && typeof body === 'object' && typeof body.message === 'string') return body.message
  if (typeof body === 'string' && body.trim()) return body.trim()
  return 'GitHub 沒有回傳錯誤訊息'
}

async function githubJson({ method, url, token, body, ok }) {
  const response = await githubRequest({
    method,
    url,
    token,
    headers: body == null ? undefined : { 'Content-Type': 'application/json' },
    body
  })
  if (!ok.includes(response.status)) {
    throw new GitHubError(
      `${method} ${url} 失敗（${response.status}）：${githubMessage(response.body)}`,
      response.status
    )
  }
  return response.body
}

async function withRetry(label, fn) {
  let lastError
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      const status = error instanceof GitHubError ? error.status : 0
      const retryable = status === 0 || status === 422 || status >= 500
      console.error(
        `${label} 失敗（${attempt}/3）：${error instanceof Error ? error.message : error}`
      )
      if (!retryable || attempt === 3) break
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000))
    }
  }
  throw lastError
}

async function listReleases(token, owner, repo) {
  const releases = []
  for (let page = 1; page <= 20; page += 1) {
    const batch = await githubJson({
      method: 'GET',
      url: `https://api.github.com/repos/${owner}/${repo}/releases?per_page=100&page=${page}`,
      token,
      ok: [200]
    })
    if (!Array.isArray(batch) || batch.length === 0) break
    releases.push(...batch)
    if (batch.length < 100) break
  }
  return releases
}

function assertCleanTree() {
  const dirty = gitOutput(['status', '--porcelain'])
  if (dirty) fail('工作區還有未提交的變更，請先 commit 再發版')
}

async function prepareVersion(token, owner, repo, pkg) {
  const tag = `v${pkg.version}`
  const headTags = gitOutput(['tag', '--points-at', 'HEAD']).split('\n').filter(Boolean)
  const headHasTag = headTags.includes(tag)

  if (retry) {
    if (parseReleaseLevel(process.argv.slice(2))) fail('補上傳不會升版，請拿掉版本參數')
    if (!headHasTag) {
      fail(`${tag} 不在目前的 commit 上。請切到該版本再補上傳，或改跑 pnpm release:win 發新版`)
    }
    console.log(`補上傳 ${tag}，不升版`)
    return
  }

  if (headHasTag) {
    const releases = (await listReleases(token, owner, repo)).filter(
      (release) => release.tag_name === tag
    )
    const names = requiredAssetNames(pkg.name, pkg.version)
    if (!isTagFullyPublished(releases, names)) {
      console.log(`${tag} 的 GitHub release 還不完整，這次不升版，只重新建置並補上傳`)
      return
    }
  }

  const level = await resolveReleaseLevel(pkg.version)
  console.log(`升版 ${pkg.version} → ${bumpVersion(pkg.version, level)}（${levelLabel[level]}）`)
  run('pnpm', ['version', level])
}

function requireArtifact(fileName) {
  const filePath = path.join(distDir, fileName)
  if (!existsSync(filePath)) {
    const found = existsSync(distDir)
      ? readdirSync(distDir)
          .filter(
            (name) => name.endsWith('.exe') || name.endsWith('.blockmap') || name.endsWith('.yml')
          )
          .join(', ')
      : ''
    fail(`找不到 ${fileName}。dist 裡有：${found || '(無)'}`)
  }
  return filePath
}

function sha512File(filePath) {
  return new Promise((resolve, reject) => {
    const hash = createHash('sha512')
    const input = createReadStream(filePath)
    input.on('error', reject)
    input.on('data', (chunk) => hash.update(chunk))
    input.on('end', () => resolve(hash.digest('base64')))
  })
}

async function writeLatestYml(version, exeName, exePath) {
  const sha512 = await sha512File(exePath)
  const yml = buildLatestYml({
    version,
    fileName: exeName,
    sha512,
    size: statSync(exePath).size,
    releaseDate: new Date().toISOString()
  })
  const filePath = path.join(distDir, 'latest.yml')
  writeFileSync(filePath, yml)
  return filePath
}

function commitsSincePreviousTag() {
  const describe = spawnSync('git', ['describe', '--tags', '--abbrev=0', 'HEAD^'], {
    cwd: root,
    encoding: 'utf8'
  })
  const previousTag = describe.status === 0 ? describe.stdout.trim() : ''
  const range = previousTag ? `${previousTag}..HEAD` : 'HEAD'
  const log = gitOutput(['log', range, '--reverse', '--pretty=format:%h%x09%s'])
  return { previousTag, commits: parseCommitLog(log) }
}

function releaseNotes(owner, repo, tag) {
  const { previousTag, commits } = commitsSincePreviousTag()
  const compareUrl = previousTag
    ? `https://github.com/${owner}/${repo}/compare/${previousTag}...${tag}`
    : ''
  return buildReleaseNotes({ previousTag, tag, commits, compareUrl })
}

async function createDraftRelease(token, owner, repo, tag, version, notes) {
  return githubJson({
    method: 'POST',
    url: `https://api.github.com/repos/${owner}/${repo}/releases`,
    token,
    body: { tag_name: tag, name: version, draft: true, body: notes },
    ok: [201]
  })
}

async function deleteRelease(token, owner, repo, releaseId) {
  await githubJson({
    method: 'DELETE',
    url: `https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}`,
    token,
    ok: [204]
  })
}

async function deleteAsset(token, owner, repo, assetId) {
  await githubJson({
    method: 'DELETE',
    url: `https://api.github.com/repos/${owner}/${repo}/releases/assets/${assetId}`,
    token,
    ok: [204, 404]
  })
}

function uploadStream({ url, token, filePath, size }) {
  return new Promise((resolve, reject) => {
    const target = new URL(url)
    const req = httpsRequest(
      {
        protocol: target.protocol,
        hostname: target.hostname,
        path: `${target.pathname}${target.search}`,
        method: 'POST',
        headers: {
          Accept: 'application/vnd.github+json',
          Authorization: `Bearer ${token}`,
          'User-Agent': 'changeimggui-release',
          'Content-Type': 'application/octet-stream',
          'Content-Length': size
        },
        timeout: 120_000
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          const body = parseBody(Buffer.concat(chunks).toString('utf8'))
          if (res.statusCode !== 201) {
            reject(
              new GitHubError(
                `上傳失敗（${res.statusCode}）：${githubMessage(body)}`,
                res.statusCode ?? 0
              )
            )
            return
          }
          resolve(body)
        })
      }
    )
    req.on('timeout', () => req.destroy(new GitHubError('上傳逾時', 0)))
    req.on('error', reject)

    let sent = 0
    let nextRatio = 0.25
    const stream = createReadStream(filePath)
    stream.on('data', (chunk) => {
      sent += chunk.length
      const ratio = sent / size
      if (ratio >= nextRatio) {
        console.log(`  ${Math.floor(ratio * 100)}%`)
        nextRatio += 0.25
      }
    })
    stream.on('error', reject)
    stream.pipe(req)
  })
}

async function uploadAsset(token, owner, repo, release, filePath, fileName) {
  const existing = (release.assets ?? []).find((asset) => asset.name === fileName)
  if (existing) await deleteAsset(token, owner, repo, existing.id)
  const size = statSync(filePath).size
  console.log(`上傳 ${fileName}（${(size / 1024 / 1024).toFixed(1)} MB）`)
  const asset = await uploadStream({
    url: `https://uploads.github.com/repos/${owner}/${repo}/releases/${release.id}/assets?name=${encodeURIComponent(fileName)}`,
    token,
    filePath,
    size
  })
  release.assets = [...(release.assets ?? []).filter((item) => item.name !== fileName), asset]
}

async function getRelease(token, owner, repo, releaseId) {
  return githubJson({
    method: 'GET',
    url: `https://api.github.com/repos/${owner}/${repo}/releases/${releaseId}`,
    token,
    ok: [200]
  })
}

function assertAssets(release, files) {
  for (const file of files) {
    const asset = (release.assets ?? []).find((item) => item.name === file.name)
    if (!asset) fail(`release 缺少 ${file.name}`)
    const size = statSync(file.path).size
    if (asset.size !== size) fail(`${file.name} 大小不一致：GitHub ${asset.size}，本地 ${size}`)
  }
}

async function publishRelease(token, owner, repo, pkg) {
  const tag = `v${pkg.version}`
  const names = artifactNames(pkg.name, pkg.version)
  const files = [
    { name: names.exe, path: requireArtifact(names.exe) },
    { name: names.blockmap, path: requireArtifact(names.blockmap) },
    {
      name: names.latest,
      path: await writeLatestYml(pkg.version, names.exe, requireArtifact(names.exe))
    }
  ]

  run('git', ['push', 'origin', 'HEAD'])
  run('git', ['push', 'origin', `refs/tags/${tag}`])

  const notes = releaseNotes(owner, repo, tag)
  console.log(notes)

  const matches = (await listReleases(token, owner, repo)).filter(
    (release) => release.tag_name === tag
  )
  let keeper = chooseKeeper(matches)
  if (!keeper) {
    console.log(`建立 draft release ${tag}`)
    keeper = await createDraftRelease(token, owner, repo, tag, pkg.version, notes)
    keeper.assets = keeper.assets ?? []
  } else if (matches.length > 1) {
    console.log(`${tag} 有 ${matches.length} 筆 release，檔案會集中到 #${keeper.id}`)
  }

  for (const file of files) {
    await withRetry(file.name, () => uploadAsset(token, owner, repo, keeper, file.path, file.name))
  }

  const published = await getRelease(token, owner, repo, keeper.id)
  assertAssets(published, files)

  for (const extra of matches) {
    if (extra.id === keeper.id) continue
    console.log(`刪除重複的 release #${extra.id}`)
    await deleteRelease(token, owner, repo, extra.id)
  }

  const visible = await githubJson({
    method: 'PATCH',
    url: `https://api.github.com/repos/${owner}/${repo}/releases/${keeper.id}`,
    token,
    body: { draft: false, make_latest: 'true', body: notes },
    ok: [200]
  })
  console.log(`已公開 ${tag}：${visible.html_url}`)
}

async function main() {
  const token = githubToken()
  const pkg = readPackage()
  const { owner, repo } = repoFromPackage(pkg)
  assertCleanTree()
  await prepareVersion(token, owner, repo, pkg)

  run('pnpm', ['run', 'build'])
  run('pnpm', ['exec', 'electron-builder', '--win', '--publish', 'never'])

  await publishRelease(token, owner, repo, readPackage())
}

const entry = process.argv[1] ? path.resolve(process.argv[1]) : ''
if (entry === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
