import assert from 'node:assert/strict'
import test from 'node:test'
import {
  artifactNames,
  buildLatestYml,
  bumpVersion,
  chooseKeeper,
  isTagFullyPublished,
  parseReleaseLevel,
  requiredAssetNames
} from './release-win.mjs'

test('artifact names match the installer electron-updater downloads', () => {
  assert.deepEqual(artifactNames('changeimggui', '1.1.0'), {
    exe: 'changeimggui-1.1.0-setup.exe',
    blockmap: 'changeimggui-1.1.0-setup.exe.blockmap',
    latest: 'latest.yml'
  })
  assert.deepEqual(requiredAssetNames('changeimggui', '1.1.0'), [
    'changeimggui-1.1.0-setup.exe',
    'changeimggui-1.1.0-setup.exe.blockmap',
    'latest.yml'
  ])
})

test('latest.yml keeps the field order electron-updater expects', () => {
  const yml = buildLatestYml({
    version: '1.0.11',
    fileName: 'changeimggui-1.0.11-setup.exe',
    sha512: 'abc+/=',
    size: 10,
    releaseDate: '2026-11-10T08:06:06.652Z'
  })
  assert.equal(
    yml,
    [
      'version: 1.0.11',
      'files:',
      '  - url: changeimggui-1.0.11-setup.exe',
      '    sha512: abc+/=',
      '    size: 10',
      'path: changeimggui-1.0.11-setup.exe',
      'sha512: abc+/=',
      "releaseDate: '2026-11-10T08:06:06.652Z'",
      ''
    ].join('\n')
  )
})

test('a split tag is not treated as published', () => {
  const names = requiredAssetNames('changeimggui', '1.1.0')
  const releases = [
    { id: 1, draft: false, assets: [{ name: names[1] }] },
    { id: 2, draft: false, assets: [{ name: names[0] }, { name: names[2] }] }
  ]
  assert.equal(isTagFullyPublished(releases, names), false)
  assert.equal(chooseKeeper(releases)?.id, 2)
})

test('an unfinished draft is kept instead of a published sibling', () => {
  const releases = [
    { id: 8, draft: false, assets: [{ name: 'latest.yml' }] },
    { id: 9, draft: true, assets: [] }
  ]
  assert.equal(chooseKeeper(releases)?.id, 9)
  assert.equal(isTagFullyPublished(releases, ['latest.yml']), false)
})

test('release level accepts 大中小 and semver names', () => {
  assert.equal(parseReleaseLevel([]), null)
  assert.equal(parseReleaseLevel(['--retry']), null)
  assert.equal(parseReleaseLevel(['中']), 'minor')
  assert.equal(parseReleaseLevel(['--major']), 'major')
  assert.equal(parseReleaseLevel(['2']), 'minor')
  assert.throws(() => parseReleaseLevel(['big']), /無法辨識參數/)
  assert.throws(() => parseReleaseLevel(['大', '小']), /只能選一種版本/)
})

test('bump keeps the chosen component and resets the smaller ones', () => {
  assert.equal(bumpVersion('1.1.0', 'patch'), '1.1.1')
  assert.equal(bumpVersion('1.1.9', 'minor'), '1.2.0')
  assert.equal(bumpVersion('1.4.2', 'major'), '2.0.0')
})

test('one complete published release can be followed by the next version', () => {
  const names = requiredAssetNames('changeimggui', '1.0.11')
  const releases = [{ id: 3, draft: false, assets: names.map((name) => ({ name })) }]
  assert.equal(isTagFullyPublished(releases, names), true)
})
