//Global functions are functions that are shared between multiple areas in the project.
let static_variables = require("./static-variables")

module.exports = {
	//this function will search for a repository object from the main linked list by using a repoName (string) as a parameter
	//it'll return false if the repository is not found.
	//it'll return the Repository object if its found.
	searchForRepo: (repoName) => {
		let foundIndex = -1;
		for (let i = 0; i < static_variables.repoLinkedList.length; i++) {
			if(static_variables.repoLinkedList[i].getSheetName() === repoName){
				foundIndex = i;
			}
		}
		console.log("Found Index: " + foundIndex)
		if(foundIndex!==-1){
			return static_variables.repoLinkedList[foundIndex];
		}
		return false;
	},
	//this function will search for a repository object from the main linked list by using a repoName (string) as a parameter
	//it'll return false if the repository is not found.
	//it'll return the Repository object's position in the linked list if its found.
	searchForRepoIndex: (repoName)=>{
		let foundIndex = -1;
		for (let i = 0; i < static_variables.repoLinkedList.length; i++) {
			if(static_variables.repoLinkedList[i].getSheetName() === repoName){
				foundIndex = i;
			}
		}
		if(foundIndex!==-1){
			return foundIndex
		}
		return false;
	}
}