const { GoogleSpreadsheet } = require('google-spreadsheet'); //google-spreadsheet library
let static_variables = require('./static-variables')
let {searchForRepo, searchForRepoIndex} = require('./global-functions')
let {returnToLinkedListObj, returnIssueArrToClassObj} = require('./deserialize-classObj')
let serialize = require('serialize-javascript');//serialization library
let moment = require('moment'); //moment library

let { Repository } = require("../classes/Repository");
let { Issue } = require("../classes/Issue");

const consoleSheet = new GoogleSpreadsheet(static_variables.googleSheetsConsoleDocID)
const IssueRepositorySheet = new GoogleSpreadsheet(static_variables.googleSheetsIssueRepo)

let deserialize=(serializedJavascript)=>{
	return eval('(' + serializedJavascript + ')');
}

//function to authenticate the google user.
let configureDocAuth = async (doc)=>{
	// Initialize Auth - see more available options at https://theoephraim.github.io/node-google-spreadsheet/#/getting-started/authentication
	await doc.useServiceAccountAuth({
		client_email: "xxx",
		private_key: "xxx",
	});
}
//if the repository doesn't have a corresponding sheet on google sheets it'll call this function in order to make the new sheet.
let copyPasteNewSheetOnDoc = async (newRepo)=>{
	await configureDocAuth(IssueRepositorySheet);

	await IssueRepositorySheet.loadInfo(); //Loads in the information
	const goldenCopy = IssueRepositorySheet.sheetsByTitle["Golden Copy"]; //getting the golden copy sheet from the document
	await goldenCopy.copyToSpreadsheet(static_variables.googleSheetsIssueRepo) //copy pasting this golden copy into the same document

	await IssueRepositorySheet.loadInfo(); //reload information in order to refresh cache.
	const copyOfGoldenCopy = IssueRepositorySheet.sheetsByTitle["Copy of Golden Copy"] //getting the copy of golden copy from document
	await copyOfGoldenCopy.updateProperties({title:newRepo.getSheetName()}) //renaming the golden copy into the name of the repository.
}
//This function writes to a new line on google sheets in order for debugging to happen on Lambda
let consoleWriteLine = async (message)=>{
	await configureDocAuth(consoleSheet);
	await consoleSheet.loadInfo();
	const sheet = consoleSheet.sheetsByIndex[0];
	let currentDateTime = moment(new Date()).format("DD/MM/YYYY HH:mm:ss")
	await sheet.addRow({Timestamp:currentDateTime,Message:message});
}
//Update the serialized string on the console google sheet.
let pushNewSerializedData = async (fullLinkedList) => {
	let stringObj = serialize(fullLinkedList); //serializing the linked list

	await configureDocAuth(consoleSheet);
	await consoleSheet.loadInfo();

	const dataSheet = consoleSheet.sheetsByTitle["data"]; //grabbing the data sheet from the console panel document
	const rows = await dataSheet.getRows(); //grabbing rows
	rows[0].Data = stringObj; // update a value
	await rows[0].save(); // save updates
}
//Update the local Linked List in static variables that stores all the data and brings it back to normal class objects.
let updateLocalLinkedList = async () => {
	static_variables.repoLinkedList = null; //will set the current linked list to null such that the application can listen to when it's no longer null to know update is complete.

	await configureDocAuth(consoleSheet);
	await consoleSheet.loadInfo();

	const dataSheet = consoleSheet.sheetsByTitle["data"];
	const rows = await dataSheet.getRows();

	static_variables.repoLinkedList = returnToLinkedListObj(deserialize(rows[0].Data)) //grabs data from the sheet then using the deserialization module it'll turn String to JSON then from JSON to Class Objects
	//console.log(static_variables.repoLinkedList)
}
//this function will search the google document for any sheets named after a repository given as the parameter.
//will return true if it exists, false if it doesn't
let searchForRepoOnSheets = async (repo_name) =>{
	let foundSheet = false;
	await configureDocAuth(IssueRepositorySheet);
	await IssueRepositorySheet.loadInfo();
	//searching through all the sheets to see if the title currently already exists in the program
	for(let i=0; i<IssueRepositorySheet.sheetsByIndex.length; i++){
		//console.log(IssueRepositorySheet.sheetsByIndex[i].title)
		//if the title exists in the sheets then it'll set the sheet found to true such that no new sheet will be created again.
		if(IssueRepositorySheet.sheetsByIndex[i].title ===repo_name){
			foundSheet = true;
		}
	}
	return foundSheet
}
//this function will initiate a new repository and create a sheet for it on google docs should it not exist.
let initiateNewRepo = async (sheetName, numOfIssues, repoURL, initIssue)=>{
	await updateLocalLinkedList();//updating the local linked list by pulling data from google sheets.
	let next = async ()=>{
		let newRepo = new Repository(sheetName, numOfIssues, repoURL); //initiating a new Repository Object
		await configureDocAuth(IssueRepositorySheet);
		await IssueRepositorySheet.loadInfo();
		let foundSheet = await searchForRepoOnSheets(newRepo.getSheetName()) //seeing if the Repository currently already exists as a sheet on google sheet
		if(!foundSheet){ //if the sheet doesn't exist on google sheets it'll create it
			await copyPasteNewSheetOnDoc(newRepo)
		}
		//searching through the linked list of repositories to see if the current Repository exists in the linked list
		//The Repo Doesn't exist in the current Linked List
		if(!searchForRepo(newRepo.getSheetName())){
			if(initIssue){ //see if there is an initial issue that needs to be uploaded along with the repository
				newRepo.addIssue(initIssue)
			}
			static_variables.repoLinkedList.push(newRepo) // push the new repository to the linked list
			await pushNewSerializedData(static_variables.repoLinkedList) //update this information on the online google sheets.
		}
		else{
			//await consoleWriteLine("Repo already exists in database.")
			console.log("Repo already exists in Linked List.")
		}
		//console.log(static_variables.repoLinkedList);
		await updateGoogleSheet(static_variables.repoLinkedList) //update the google sheets with the new Repository data.
	}
	//letting the local linked list update by itself before the function is allowed to continue.
	let waitOut = async()=>{
		if(static_variables.repoLinkedList === null){setTimeout(waitOut,1000)} //if the variable is still null it will not continue
		else{await next();} //once the variable is no longer null it'll call the next function
	}
	await waitOut();
}
//takes the master linked list. Looks through it and updates the google sheet accordingly
let updateGoogleSheet = async (linkedList) =>{
	await configureDocAuth(IssueRepositorySheet);
	await IssueRepositorySheet.loadInfo();

	//this will loop through every repository in the given linked list.
	for(let i=0; i<linkedList.length; i++){
		let currentSheet = await IssueRepositorySheet.sheetsByTitle[linkedList[i].getSheetName()] //seeing if the current sheet exists on the document
		if(currentSheet !== undefined){ //the current sheet exists in the document.
			let newRows = []; // new issues that were created will be put in here to be added as rows.
			let rows = await currentSheet.getRows(); //getting all rows in the current sheet.

			//if the number of rows are less than or equal the number of issues in the repository it means the user is adding / amending data.
			if(rows.length<=linkedList[i].getNumOfIssues()) {
				//have to serialize and deserialize linked-list such that the new variable (tempIssueList) doesn't become point to the linked-list
				let tempIssueList = serialize(linkedList[i].getAllIssues()); //temp issue list will store all the issues that need to be added as rows.
				tempIssueList = returnIssueArrToClassObj(deserialize(tempIssueList))

				//will loop through the total number of issues in the repository
				for (let j = linkedList[i].getNumOfIssues() - 1; j > -1; j--) {
					//will go through each row on the google sheet given that it exists
					if (rows[j] !== undefined) {
						let issueObj = linkedList[i].searchForIssue(parseInt(rows[j]["Num"])) //finding which issue object the row is refering to.
						//if this issue hasn't been deleted on the github
						if (issueObj !== false) {
							//updating data start
							rows[j]["Issue Title"] = issueObj.getIssueTitle();
							rows[j]["Issue Opened By"] = issueObj.getIssueOpenedBy();
							rows[j]["Last Modified By"] = issueObj.getLastModifiedBy();
							rows[j]["Last Modified Date"] = issueObj.getLastModifiedDate();
							rows[j]["State"] = issueObj.getCurrentState();
							rows[j]["Issue URL"] = issueObj.getUrlHTML();
							await rows[j].save();
							//updating data end
							//this will loop through the temp issues list and remove the issues that have already been amended.
							//the issues left over will be added as new rows to the document.
							for (let k = tempIssueList.length - 1; k > -1; k--) {
								if (tempIssueList[k].getIssueNumber() === parseInt(rows[j]["Num"])) {
									tempIssueList.splice(k, 1);
								}
							}
						}
					}
				}
				//looping through what's left of the temp issue list and making them into a JSON object to be pushed into the google sheet as new rows.
				for (let j = 0; j < tempIssueList.length; j++) {
					let tempJSON = {
						"Num": tempIssueList[j].getIssueNumber(),
						"Issue Title": tempIssueList[j].getIssueTitle(),
						"Issue Opened By": tempIssueList[j].getIssueOpenedBy(),
						"Last Modified By": tempIssueList[j].getLastModifiedBy(),
						"Last Modified Date": tempIssueList[j].getLastModifiedDate(),
						"State": tempIssueList[j].getCurrentState(),
						"Issue URL": tempIssueList[j].getUrlHTML()
					}
					newRows.push(tempJSON)
				}
				//adding the new rows.
				await currentSheet.addRows(newRows);
			}
			//if the number of rows is greater than the number of items there are in the repository linked list it means the user has deleted an issue.
			if(rows.length>linkedList[i].getNumOfIssues()) {
				//loop through all the rows available in the google sheet.
				for (let j = rows.length - 1; j > -1; j--) {
					//if the rows exist
					if (rows[j] !== undefined) {
						//checking to see if the issue still exists in our linked list
						let issueObj = linkedList[i].searchForIssue(parseInt(rows[j]["Num"]))
						//should it not exist anymore the issue is deleted from the google sheet.
						//await consoleWriteLine("Searching Through Row: " + parseInt(rows[j]["Num"]))
						if (issueObj === false) {
							rows[j].delete();
							await consoleWriteLine("Deleting...")
						}
					}
				}
			}
		}
	}
}
module.exports = {
	//This function writes to a new line on google sheets in order for debugging to happen on Lambda
	consoleWriteLine: async (message)=>{
		await consoleWriteLine(message)
	},
	//this function will initiate a new repository and create a sheet for it on google docs should it not exist.
	initiateNewRepo: async (sheetName, numOfIssues, repoURL) => {
		await initiateNewRepo(sheetName, numOfIssues, repoURL);
	},
	//will start the process to add a new issue into the linked list and also into the google sheet sorted in the correct category.
	addNewIssue: async (repo_name, repo_url, issueObj)=>{
		await updateLocalLinkedList(); //updating the local linked list by pulling data from google sheets.
		let waitOut = async ()=>{ //letting the local linked list update by itself before the function is allowed to continue.
			if(static_variables.repoLinkedList===null){
				setTimeout(waitOut, 1000) //if the variable is still null it will not continue
			}
			else{
				await next(); //once the variable is no longer null it'll call the next function
			}
		}
		let next = async()=>{
			let foundSheet = await searchForRepoOnSheets(repo_name) //seeing if a sheet with this repository's name exists on the google document.
			if(searchForRepoIndex(repo_name)!==false){ //the repository currently exists within our linked list.
				console.log("Repo Detected... Updating Sheets")
				let issueOpenedBy = "" //issue opened by will not change, it'll stay constant from the first time it receives a name.
				//console.log(static_variables.repoLinkedList[searchForRepoIndex(repo_name)])
				//if the current issue already exists within the repository
				if(static_variables.repoLinkedList[searchForRepoIndex(repo_name)].searchForIssue(issueObj.getIssueNumber())!==false){
					//the issue opened by is saved before the issue is updated with new data.
					issueOpenedBy = static_variables.repoLinkedList[searchForRepoIndex(repo_name)].searchForIssue(issueObj.getIssueNumber()).getIssueOpenedBy();
				}
				else{
					//this is the first time this issue has appeared within this repository.
					issueOpenedBy = issueObj.getIssueOpenedBy();
				}
				//console.log("Issue Opened By: " + issueOpenedBy)
				//if the issue already exists within this repository
				if(static_variables.repoLinkedList[searchForRepoIndex(repo_name)].searchForIssue(issueObj.getIssueNumber())!==false){
					//it'll remove the issue.
					static_variables.repoLinkedList[searchForRepoIndex(repo_name)].removeIssue(issueObj.getIssueNumber())
					//console.log("Removed Issue: ")
					//console.log(static_variables.repoLinkedList[searchForRepoIndex(repo_name)].getAllIssues())
				}
				issueObj.postIssueOpenedBy(issueOpenedBy); //changing the issue opened by back into it's original author.
				static_variables.repoLinkedList[searchForRepoIndex(repo_name)].addIssue(issueObj); //adding the issue into the repository.
				//console.log("Added Back Issue")
				//console.log(static_variables.repoLinkedList[searchForRepoIndex(repo_name)].getAllIssues())
				await pushNewSerializedData(static_variables.repoLinkedList)//pushing this new linked list into google sheets
				//the sheet doesn't exist on google sheets yet.
				if(!foundSheet){
					await initiateNewRepo(repo_name, 0, repo_url) //it'll create the new sheet on the document then add the new issues inside.
				}
				else{
					await updateGoogleSheet(static_variables.repoLinkedList) //it'll update the google sheets with this new issue.
				}
			}
			else{
				//the repository is new and has not been added into linked list yet
				console.log("repo not detected, creating new Repo")
				//this will check to see if the sheet exists, if it doesn't it'll create it along with adding this as it's first issue.
				await initiateNewRepo(repo_name, 0, repo_url, issueObj)
			}
		}
		await waitOut();
	},
	//this function will delete an issue from the repository linked list and then delete it from google sheets.
	deleteIssue: async (repo_name, repo_url, issueObj)=>{
		await updateLocalLinkedList(); //updating the local linked list by pulling data from google sheets.
		let waitOut = async ()=>{ //letting the local linked list update by itself before the function is allowed to continue.
			if(static_variables.repoLinkedList===null){
				setTimeout(waitOut, 1000) //if the variable is still null it will not continue
			}
			else{
				await next(); //once the variable is no longer null it'll call the next function
			}
		}
		let next = async()=> {
			//the issue currently exists within the linked list repository in question
			if(static_variables.repoLinkedList[searchForRepoIndex(repo_name)].searchForIssue(issueObj.getIssueNumber())!==false){
				//it'll remove the repository.
				static_variables.repoLinkedList[searchForRepoIndex(repo_name)].removeIssue(issueObj.getIssueNumber())
			}
			await pushNewSerializedData(static_variables.repoLinkedList) //New linked list will be updated on google sheets
			await updateGoogleSheet(static_variables.repoLinkedList) //new sheets data will be added to the google sheets.
		}
		await waitOut();
	}
}
