class Issue {
	constructor(urlHTML, issueID, issueNumber, issueTitle, issueOpenedBy, lastModifiedBy, currentState, lastModifiedDate) {
		this.urlHTML = urlHTML;
		this.issueID = issueID;
		this.issueNumber = issueNumber;
		this.issueTitle = issueTitle;
		this.issueOpenedBy = issueOpenedBy;
		this.lastModifiedBy = lastModifiedBy;
		this.lastModifiedDate = lastModifiedDate;
		this.currentState = currentState;
	}
	getUrlHTML(){
		return this.urlHTML;
	}
	getIssueID(){
		return this.issueID;
	}
	getIssueNumber(){
		return this.issueNumber;
	}
	getIssueTitle(){
		return this.issueTitle;
	}
	getIssueOpenedBy(){
		return this.issueOpenedBy;
	}
	getLastModifiedBy(){
		return this.lastModifiedBy;
	}
	getLastModifiedDate(){
		return this.lastModifiedDate;
	}
	getCurrentState(){
		return this.currentState;
	}

	postUrlHTML(newUrlHTML){
		this.urlHTML = newUrlHTML;
	}
	postIssueID(newIssueID){
		this.issueID = newIssueID;
	}
	postIssueNumber(newIssueNumber){
		this.issueNumber = newIssueNumber;
	}
	postIssueTitle(newIssueTitle){
		this.issueTitle = newIssueTitle;
	}
	postIssueOpenedBy(newIssueOpenedBy){
		this.issueOpenedBy = newIssueOpenedBy;
	}
	postLastModifiedBy(newLastModifiedBy){
		this.lastModifiedBy = newLastModifiedBy;
	}
	postCurrentState(newCurrentState){
		this.currentState = newCurrentState;
	}

}

module.exports.Issue = Issue;