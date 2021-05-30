let {Issue} = require("../classes/Issue");
let {Repository} = require("../classes/Repository");

//this module's main function is the deserialize data from JSON into Class Objects, namely Issue and Repository.

//this function will turn a linkedlist of Issue JSON into a linked list of Issue Objects.
let returnIssueArrToClassObj = (issueJSON) =>{
	let tempArray = [];
	for(let i=0; i<issueJSON.length; i++){
		tempArray.push(new Issue(issueJSON[i].urlHTML, issueJSON[i].issueID, issueJSON[i].issueNumber, issueJSON[i].issueTitle,issueJSON[i].issueOpenedBy,issueJSON[i].lastModifiedBy,issueJSON[i].currentState,issueJSON[i].lastModifiedDate))
	}
	return tempArray;
}

//this function will turn a JSON object for Repository and turn it into a Repository Object.
let returnJsonToClassObj = (jsonRepo) => {
	let repo = new Repository(jsonRepo.sheetName,jsonRepo.numOfIssues,jsonRepo.repoURL)
	for(let i=0; i<jsonRepo.allIssues.length; i++){
		repo.addIssue(new Issue(jsonRepo.allIssues[i].urlHTML, jsonRepo.allIssues[i].issueID, jsonRepo.allIssues[i].issueNumber, jsonRepo.allIssues[i].issueTitle,jsonRepo.allIssues[i].issueOpenedBy,jsonRepo.allIssues[i].lastModifiedBy,jsonRepo.allIssues[i].currentState,jsonRepo.allIssues[i].lastModifiedDate))
	}
	return repo;
}

//this function will take in a linked list of JSON objects for repository and return a linked list of Repository Objects.
let returnToLinkedListObj = (linkedList)=>{
	let newLinkedList = [];
	for(let i =0; i<linkedList.length; i++){
		newLinkedList.push(returnJsonToClassObj(linkedList[i]));
	}
	return newLinkedList
}

module.exports = {
	//this function will take in a linked list of JSON objects for repository and return a linked list of Repository Objects.
	returnToLinkedListObj: (linkedList)=>{
		return returnToLinkedListObj(linkedList);
	},
	//this function will turn a JSON object for Repository and turn it into a Repository Object.
	returnJsonToClassObj: (jsonRepo)=>{
		return returnJsonToClassObj(jsonRepo);
	},
	//this function will turn a linkedlist of Issue JSON into a linked list of Issue Objects.
	returnIssueArrToClassObj:(issueJSON)=>{
		return returnIssueArrToClassObj(issueJSON);
	}
}