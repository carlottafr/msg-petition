const bcrypt = require("bcryptjs");
const { promisify } = require("util");
// v asynchronous functions
let { genSalt, hash, compare } = bcrypt;

// v promisify them
genSalt = promisify(genSalt); // generates my salt -> random string
hash = promisify(hash);
// ^ takes 2 arguments: plain-text pw + salt
compare = promisify(compare);
// ^ takes 2 arguments: plain-text + hash compare value; returns boolean

module.exports.compare = compare;
module.exports.hash = (plainTxtPw) =>
    genSalt().then((salt) => hash(plainTxtPw, salt));

// Example:
// genSalt()
//     .then((salt) => {
//         // console.log(salt);
//         return hash("superSafePassword", salt);
//     })
//     .then((hashedPassword) => {
//         // console.log("hashed and salted PW: ", hashedPassword);
//         return compare("superSafePassword", hashedPassword);
//     })
//     .then((matchValueOfCompare) => {
//         console.log("The match value: ", matchValueOfCompare);
//     });
