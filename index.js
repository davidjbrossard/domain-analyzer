const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const fs = require('fs');
const { XMLParser, XMLBuilder, XMLValidator } = require("fast-xml-parser");

function parseXACML(xacmlContent) {

    const parser = new XMLParser();
    let jObj = parser.parse(xacmlContent);


    const builder = new XMLBuilder();
    const xmlContent = builder.build(jObj);
}

function generateDocumentation(title, attributes, policies) {
    let documentation = "";
    // 1. Add Title
    documentation += "# " + title + "\n";
    documentation += "## Policy Overview\n";
    for (var policy in policies) {
        p = parseXACML(policy);
        documentation += " - " + "some name" + "\n";

    }
    documentation += "## Attribute Overview\n";
    for (var attribute in attributes) {
        documentation += " - " + attribute.xacmlId + "\n";
    }
    return documentation;
}

try {
    const domainFile = core.getInput('domain-file');
    const outputFile = core.getInput('output-file');
    console.log(`Processing ${domainFile}!`);
    const yamlData = yaml.load(fs.readFileSync(domainFile, 'utf8'));
    console.log();
    console.log(yamlData.policy.mainPolicyId);

    // Write data in 'Output.txt' .
    fs.writeFile(outputFile, generateDocumentation("Documentation for domain " + yamlData.identity, yamlData.attributes, yamlData.policy.xacmlSpecifications), (err) => {
        // In case of a error throw err.
        if (err) throw err;
    })
    console.log('Wrote md file to '+outputFile);
} catch (error) {
    core.setFailed(error.message);
}
