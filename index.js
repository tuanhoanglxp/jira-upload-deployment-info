"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const url_1 = require("url");
const core = require('@actions/core');
const github = require('@actions/github');
const request = require('request-promise-native');
const dateFormat = require('dateformat');
const token = require('@highwaythree/jira-github-actions-common');
async function submitDeploymentInfo(accessToken) {
    const cloudInstanceBaseUrl = core.getInput('cloud-instance-base-url');
    const cloudURL = new url_1.URL('/_edge/tenant_info', cloudInstanceBaseUrl);
    let cloudId = await request(cloudURL.href);
    cloudId = JSON.parse(cloudId);
    cloudId = cloudId.cloudId;
    const deploymentSequenceNumber = core.getInput('deployment-sequence-number');
    const updateSequenceNumber = core.getInput('update-sequence-number');
    const issueKeys = core.getInput('issue-keys');
    const displayName = core.getInput('display-name');
    const url = core.getInput('url');
    const description = core.getInput('description');
    let lastUpdated = core.getInput('last-updated');
    const label = core.getInput('label');
    const state = core.getInput('state');
    const pipelineId = core.getInput('pipeline-id');
    const pipelineDisplayName = core.getInput('pipeline-display-name');
    const pipelineUrl = core.getInput('pipeline-url');
    const environmentId = core.getInput('environment-id');
    const environmentDisplayName = core.getInput('environment-display-name');
    const environmentType = core.getInput('environment-type');
    console.log("lastUpdated: " + lastUpdated);
    lastUpdated = dateFormat(lastUpdated, "yyyy-mm-dd'T'HH:MM:ss'Z'");
    const deployment = {
        schemaVersion: "1.0",
        deploymentSequenceNumber: deploymentSequenceNumber || process.env['GITHUB_RUN_ID'],
        updateSequenceNumber: updateSequenceNumber || process.env['GITHUB_RUN_ID'],
        issueKeys: issueKeys.split(',') || [],
        displayName: displayName || '',
        url: url || `${github.context.payload.repository.url}/actions/runs/${process.env['GITHUB_RUN_ID']}`,
        description: description || '',
        lastUpdated: lastUpdated || '',
        label: label || '',
        state: state || '',
        pipeline: {
            id: pipelineId || `${github.context.payload.repository.full_name} ${github.context.workflow}`,
            displayName: pipelineDisplayName || `Workflow: ${github.context.workflow} (#${process.env['GITHUB_RUN_NUMBER']})`,
            url: pipelineUrl || `${github.context.payload.repository.url}/actions/runs/${process.env['GITHUB_RUN_ID']}`,
        },
        environment: {
            id: environmentId || '',
            displayName: environmentDisplayName || '',
            type: environmentType || '',
        }
    };
    let bodyData = {
        deployments: [deployment],
    };
    bodyData = JSON.stringify(bodyData);
    const options = {
        method: 'POST',
        url: "https://api.atlassian.com/jira/deployments/0.1/cloud/c5551130-627b-40c1-b03a-eb41d2779238/bulk",
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            Authorization: "Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6Ik16bERNemsxTVRoRlFVRTJRa0ZGT0VGRk9URkJOREJDTVRRek5EZzJSRVpDT1VKRFJrVXdNZyJ9.eyJodHRwczovL2F0bGFzc2lhbi5jb20vc3lzdGVtQWNjb3VudElkIjoiNjIxYzgyNGY5MzJmMGYwMDcxNjU4ZWU0IiwiaHR0cHM6Ly9hdGxhc3NpYW4uY29tL3N5c3RlbUFjY291bnRFbWFpbCI6ImYyMTk1NTYxLTllMWEtNGNkNC1iNGE1LWQ1MWZlZTEyMmRkM0Bjb25uZWN0LmF0bGFzc2lhbi5jb20iLCJodHRwczovL2F0bGFzc2lhbi5jb20vZmlyc3RQYXJ0eSI6ZmFsc2UsImh0dHBzOi8vYXRsYXNzaWFuLmNvbS8zbG8iOmZhbHNlLCJpc3MiOiJodHRwczovL2F0bGFzc2lhbi1hY2NvdW50LXByb2QucHVzMi5hdXRoMC5jb20vIiwic3ViIjoiTzI4YllVdDRWS3lPN1VwT2NPdUowQWVMWGpHRzBlNmNAY2xpZW50cyIsImF1ZCI6ImFwaS5hdGxhc3NpYW4uY29tIiwiaWF0IjoxNjQ2MDYwNjY4LCJleHAiOjE2NDYwNjQyNjgsImF6cCI6Ik8yOGJZVXQ0Vkt5TzdVcE9jT3VKMEFlTFhqR0cwZTZjIiwic2NvcGUiOiJtYW5hZ2U6amlyYS1kYXRhLXByb3ZpZGVyIiwiZ3R5IjoiY2xpZW50LWNyZWRlbnRpYWxzIn0.iTP6vldZAJI621shy96hpnD3xI9UKowu9tNzNq0t_12VcgYvDt_TfgZ7M-jG3ma9QBdGfkRfemkcMaaIWHil-PvQYMfwO2W_NhPPj-tuTR-XfGPHnnS07CerDdK675PlOIXf4qKyl7fkdaQbjKFDCjG0uTWPhAioOPi1Zww1QMARi0PAUsmcUt42F6R3erHgyvayri5xbGxGqSWiQhGXBMaMlwNanhyD5E1eXn8GWlALxAHZpUKmItqwkU8J0ZcQJP475Wvgvlzd_NhONog5JvGiPdpaQxOVZ_sLXfKlgdncpqS7lG4ETw7aR5moK9U5ibnzMJgsPzq8Vk3beQ9kzw",
        },
        body: bodyData,
    };
    let responseJson = await request(options);
    let response = JSON.parse(responseJson);
    if (response.rejectedDeployments && response.rejectedDeployments.length > 0) {
        const rejectedDeployment = response.rejectedDeployments[0];
        console.log("errors: ", rejectedDeployment.errors);
        let errors = rejectedDeployment.errors.map((error) => error.message).join(',');
        errors.substr(0, errors.length - 1);
        console.log("joined errors: ", errors);
        core.setFailed(errors);
    }
    core.setOutput("response", responseJson);
}
exports.submitDeploymentInfo = submitDeploymentInfo;
(async function () {
    try {
        const clientId = core.getInput('client-id');
        const clientSecret = core.getInput('client-secret');
        const accessTokenResponse = await token.getAccessToken(clientId, clientSecret);
        await submitDeploymentInfo(accessTokenResponse.access_token);
        console.log("finished submitting deployment info");
    }
    catch (error) {
        core.setFailed(error.message);
    }
})();
