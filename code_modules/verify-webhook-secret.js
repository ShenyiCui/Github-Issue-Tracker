/*
 * Verify GitHub webhook signature header in Node.js
 * Written by stigok and others (see gist link for contributor comments)
 * https://gist.github.com/stigok/57d075c1cf2a609cb758898c0b202428
 * Licensed CC0 1.0 Universal
 * Modified By Shenyi Cui
 */

const crypto = require('crypto')
let static_variables = require("./static-variables")
const secret = static_variables.webHookSecret;

// For these headers, a sigHashAlg of sha1 must be used instead of sha256
// GitHub: X-Hub-Signature
// Gogs:   X-Gogs-Signature
const sigHeaderName = 'X-Hub-Signature-256'
const sigHashAlg = 'sha256'

module.exports = {
	verifyPostData: (headers,body)=>{
		if (!body) {
			return false
		}
		const sig = Buffer.from(headers[sigHeaderName] || '', 'utf8')
		const hmac = crypto.createHmac(sigHashAlg, secret)
		const digest = Buffer.from(sigHashAlg + '=' + hmac.update(JSON.stringify(body)).digest('hex'), 'utf8')
		if (sig.length !== digest.length || !crypto.timingSafeEqual(digest, sig)) {
			return false
		}

		return true
	}
}

