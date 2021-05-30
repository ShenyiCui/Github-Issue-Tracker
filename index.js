let {consoleWriteLine, initiateNewRepo, addNewIssue, deleteIssue} = require('./code_modules/google-spreadsheet-functions')
let verify_webhook_secret = require("./code_modules/verify-webhook-secret")
let moment = require('moment')

let {Issue} = require("./classes/Issue")

exports.handler = async (event) => {
	// TODO implement
	const response = {
		statusCode: 200,
		codeTimestamp: "Code CAA 300521 0630",
		body: "",
		debugData:[],
	};
	//verifying the secret Webhook key
	if(verify_webhook_secret.verifyPostData(event.headers,event.body)){
		//await consoleWriteLine("Secret Verified"); //Verified Secret
		response.body = "Event Registered and Received"
		//Only the ping command contains the "zen" key.
		if(event.body.hasOwnProperty("zen")){
			await consoleWriteLine("Creating Repository");
			await initiateNewRepo(event.body.repository.name, 0, event.body.repository.html_url);
		}
		else{
			//if its not a ping command it is an issue
			//creating the issue object
			let issueObj = new Issue(event.body.issue.html_url,event.body.issue.id, event.body.issue.number, event.body.issue.title, event.body.issue.user.login, event.body.issue.user.login, event.body.issue.state, moment(new Date()).format("DD/MM/YYYY HH:mm:ss"))
			//the user has deleted the issue
			if(event.body.action === "deleted"){
				await consoleWriteLine("Deleting Event");
				await deleteIssue(event.body.repository.name, event.body.repository.html_url, issueObj)
			}
			//the user has added / amended a new issue
			else{
				await consoleWriteLine("Adding/Amending Event");
				await addNewIssue(event.body.repository.name, event.body.repository.html_url, issueObj)
			}
		}
	}
	//secret is invalid
	else{
		await consoleWriteLine("Secret Invalid");
		response.body = "Webhook Secret is Invalid"
	}

	return response;
};
