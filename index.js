const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const fs = require('fs');


try {
  const domainFile = core.getInput('domain-file');
  console.log(`Processing ${domainFile}!`);
  const yamlData = yaml.load(fs.readFileSync(domainFile, 'utf8'));
  console.log(yamlData.identity);
  console.log(yamlData.attributes);
  console.log(yamlData.policy.mainPolicyId);
} catch (error) {
  core.setFailed(error.message);
}
