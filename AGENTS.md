# Agent rules

## Language

Write rules and skills in English.

## Company project layout

This repository is a desktop tool for the company's web projects. Project selection, `companyList`, company folders, config switching, and image rename, convert, compress, and replace all follow that project layout.

Cloud Agents must not invent a company project layout to test these flows. Do not add fake `companyList` directories, company configs, favicons, or replacement images to walk through the full flow.

Test these flows with a local agent, or with a company project the user supplies later.

Without a supplied company project, a Cloud Agent only verifies this tool: dependency install, typecheck, and that the application starts. The company-project flow stays out of scope until a real project is provided.
