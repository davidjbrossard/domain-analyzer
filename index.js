const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const fs = require('fs');
var xpath = require('xpath');
var dom = require('@xmldom/xmldom').DOMParser;

function parseXACML(xacmlContent) {
    var doc = new dom().parseFromString(xacmlContent, 'text/xml');
    var xacmlns = xpath.useNamespaces({"xacml3": "urn:oasis:names:tc:xacml:3.0:core:schema:wd-17"});
    // var nodes = xpath.select("//xacml3:PolicySet", doc);
    var nodes = xacmlns("//xacml3:PolicySet/@PolicySetId",doc);
    console.log(nodes);
    for (var node in nodes){
        for (var attribute in nodes.attributes){
            // console.log(attribute.name);
        }
        console.log('node:'+node);
    }
    // console.log(nodes.length);
    // console.log(nodes[0].localName + ": " + nodes[0].firstChild.data);
    // console.log("Node: " + nodes[0].toString());
}

function generateDocumentation(title, attributes, policies) {
    let documentation = "";
    // 1. Add Title
    documentation += "# " + title + "\n";
    documentation += "## Overview\n";
    documentation += " - Number of policy entries: "+policies.length+"\n";
    documentation += " - Number of attributes: "+Object.entries(attributes).length+"\n";
    documentation += "## Policy Overview\n";
    policies.forEach((policy)=>{
        let p = parseXACML(policy);
        console.log();
        documentation += " - " + "some name" + "\n";
    });
    documentation += "## Attribute Overview\n";
    for (const [key, value] of Object.entries(attributes)) {
        documentation += " - " + value.xacmlId + "\n";
        documentation += "   - " + value.category + "\n";
        documentation += "   - " + value.datatype + "\n";
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
    console.log('Wrote md file to ' + outputFile);
} catch (error) {
    console.error(error);
    core.setFailed(error.message);
}
