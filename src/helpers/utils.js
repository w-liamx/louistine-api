"use strict";

const bcrypt = require('bcrypt');
const geoip = require('geoip-country');

// Returns response info 
export const responseInfo = (rCode, rState, rData, rMessage) => {
	return { rCode, rState, rData, rMessage };
};

// Returns a Backend response object
export const responseObject = (response, code, state, data, message) => {
	if (state === "error" || (state === "success" && !data)) {
		return response.status(code).json({
			status: state,
			message: message,
		});
	} else {
		return response.status(code).json({
			status: state,
			resultCount: data ? data.length : 0,
			data: data,
		});
	}
};

export const getCountry = ip => {
  const geo = geoip.lookup(ip);
  console.log(geo);
  return geo;
}

export const hashPassword = async (plainPassword) => {
  const saltRounds = 10;
  const bcryptMinorVersion = 'b';
  const salt = await bcrypt.genSalt(saltRounds, bcryptMinorVersion);
  const password = bcrypt.hash(plainPassword, salt);
  return password;
}

export const capitalize = s => {
	if (typeof s !== 'string') return '';
	return s.trim().charAt(0).toUpperCase() + s.slice(1);
}

export const camelCase2Words = s => {
	var wordsArr = s.split(/([A-Z][a-z]+)/).filter(function(e){return e});
	var words = wordsArr.join(' ');
  return capitalize(words);
}

export const sluggify = s => {
	if (!s) return '';
	return s
		.trim() //remove trailing white spaces
		.toLowerCase() //because we want case uniformity
		.replace(/ /g, '-') //convert any space to dash
		.replace(/[-]+/g, '-') //convert consecutive dashes to one dash (to avoid this--man turning to this---man)
		.replace(/[^\w-]+/g, ''); //remove any non-alphanum
}

export const generateRandomString = (len = 10, poolType = 'alphaNum') => {
	try {
		if (!['num', 'alpha', 'alphaNum'].includes(poolType)) throw new Error('Invalid pool type');
		let pool;
		switch (poolType) {
			case 'num':
				pool = '0123456789';
				break;
			case 'alpha':
				pool = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
				break;
			case 'alphaNum':
			default: 
				pool = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
				break;
		}
		let result = '';
		let i = len;
		for (; i > 0; --i) {
			result += pool[Math.round(Math.random() * (pool.length - 1))];
		}
		return result;
	} catch (err) {
		throw err.message;
	}
}
