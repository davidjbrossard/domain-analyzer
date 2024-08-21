const core = require('@actions/core');
const github = require('@actions/github');
const yaml = require('js-yaml');
const fs = require('fs');
const xpath = require('xpath');
const { isArray } = require('util');
const dom = require('@xmldom/xmldom').DOMParser;
// const xmldom = require('@xmldom/xmldom');
const selector = xpath.useNamespaces({"xacml3": "urn:oasis:names:tc:xacml:3.0:core:schema:wd-17"});
var warnings=[];

function parseBlocks(blockType, nodes){
    const parent = {
        'Rule': 'Policy',
        'Policy': 'PolicySet',
        'PolicySet': 'PolicySet'
    }
    let blocks = [];
    for (var i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        // console.log("description: "+node.getElementsByTagNameNS("urn:oasis:names:tc:xacml:3.0:core:schema:wd-17", "Description")[0].data);
        let p = {
            type: blockType,
            identifier : node.getAttribute(blockType+'Id').replace('http://axiomatics.com/alfa/identifier/',''),
            description: selector("xacml3:Description/text()",node),
            parent: parent[blockType]//node.parentNode.getAttribute(parent[block]+'Id').replace('http://axiomatics.com/alfa/identifier/','')
        };
        let ks = Object.keys(node.parentNode);
        ks.forEach((k)=>{
            if (k==='attributes'){
                p.parent = node.parentNode['attributes']['0'].value.replace('http://axiomatics.com/alfa/identifier/','');
            }
        });
        if (p.description.length==0){
            warnings.push({
                description: 'Missing documentation',
                type: blockType,
                location: p.identifier
            });
        }
        // console.log(p);
        blocks.push(p);
    }
    return blocks;
}

function parseXACML(xacmlContent) {
    let ps = [];
    try {
        let doc = new dom().parseFromString(xacmlContent, 'text/xml');
        const BLOCK_TYPES = ['PolicySet', 'Policy', 'Rule'];
        for (var block of BLOCK_TYPES){
            let nodes = selector('//xacml3:'+block,doc);
            let bs = parseBlocks(block, nodes);
            ps = ps.concat(bs);
            // bs.forEach((b)=>{
            //     ps.push(b);
            // });
        }
        
    } catch (error) {
        console.error(error);
    }
    return ps;
}

function generateDocumentation(title, attributes, policies) {
    let documentation = "";
    let intro = "";
    // 1. Add Title
    intro += "# " + title + "\n";
    intro += "## Overview\n";
    intro += " - Number of attributes: "+Object.entries(attributes).length+"\n";
    intro += " - Number of YAML policy entries: "+policies.length+"\n";
    // 2. Parse attributes from YAML definition
    documentation += "## Attribute Overview\n";
    for (const [key, value] of Object.entries(attributes)) {
        documentation += " - " + value.xacmlId + "\n";
        documentation += "   - " + value.category + "\n";
        documentation += "   - " + value.datatype + "\n";
    }
    // 3. Parse all policies
    let stats = {
        'PolicySet': 0,
        'Policy': 0,
        'Rule' : 0
    }
    documentation += "## Policy Overview\n";
    policies.forEach((policy)=>{
        let ps = parseXACML(policy);
        ps.forEach((xacmlPolicy)=>{
            documentation += " - [" + xacmlPolicy.identifier + "](#"+xacmlPolicy.identifier+")\n";
            if (xacmlPolicy.description.length>0)
                documentation += "   - "+xacmlPolicy.description+ "\n";
            documentation += "   - parent: ["+xacmlPolicy.parent+ "](#"+xacmlPolicy.parent+")\n";
            stats[xacmlPolicy.type]++;
        });
    });
    // 4. Add warnings section
    if (warnings.length>0){
        documentation += "## Warnings & Recommendations\n";
        warnings.forEach((warning)=>{
            documentation+= " - "+warning.description+"\n";
            documentation+= "   - "+warning.type+"\n";
            documentation+= "   - "+warning.location+"\n";
        });
    }
    
    // 5. Update metrics
    intro += " - Number of XACML Policy Sets: "+stats['PolicySet']+"\n";
    intro += " - Number of XACML Policies: "+stats['Policy']+"\n";
    intro += " - Number of XACML Rules: "+stats['Rule']+"\n";

    documentation = intro + documentation;
    return documentation;
}

try {
    const domainFile = core.getInput('domain-file');
    const outputFile = core.getInput('output-file');
    console.log(`Processing ${domainFile}!`);
    const yamlData = yaml.load(fs.readFileSync(domainFile, 'utf8'));

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
