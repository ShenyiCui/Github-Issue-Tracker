class Repository {
	constructor(sheetName, numOfIssues, repoURL) {
		this.sheetName = sheetName;
		this.numOfIssues = numOfIssues;
		this.repoURL = repoURL;
		this.allIssues = [];
	}

	getSheetName(){
		return this.sheetName;
	}
	getNumOfIssues(){
		return this.numOfIssues;
	}
	getRepoURL(){
		return this.repoURL;
	}
	getAllIssues(){
		return this.allIssues;
	}

	postSheetName(newSheetName){
		this.sheetName = newSheetName;
	}
	postRepoURL(newRepoURL){
		this.repoURL = newRepoURL;
	}

	addIssue(newIssue){
		this.allIssues.push(newIssue);
		this.numOfIssues = this.allIssues.length;
	}
	removeIssue(id){
		//array.splice(index, 1);
		let foundIndex = -1;
		for(let i =0; i<this.numOfIssues; i++){
			if(this.allIssues[i].getIssueNumber() === id){
				foundIndex = i;
			}
		}
		this.allIssues.splice(foundIndex,1);
		this.numOfIssues = this.allIssues.length;
	}
	searchForIssue(id){
		let foundIndex = -1;
		for(let i =0; i<this.numOfIssues; i++){
			if(this.allIssues[i].getIssueNumber() === id){
				foundIndex = i;
			}
		}
		if(foundIndex!==-1){
			return this.allIssues[foundIndex];
		}
		return false
	}
}

module.exports.Repository = Repository;