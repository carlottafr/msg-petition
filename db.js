const spicedPg = require("spiced-pg");
const db = spicedPg(
    process.env.DATABASE_URL ||
        "postgres:postgres:postgres@localhost:5432/petition"
);
// ^ returns an object with one method: .query
// .query("SQL query string").then(function(result) {}).catch(function(err) {err});

module.exports.registerAccount = (first, last, email, password) => {
    return db.query(
        `INSERT INTO users (first, last, email, password) VALUES ($1, $2, $3, $4) RETURNING id;`,
        [first, last, email, password]
    );
};

module.exports.addProfileInfo = (age, city, url, userId) => {
    return db.query(
        `INSERT INTO user_profiles (age, city, url, user_id) VALUES ($1, $2, $3, $4);`,
        [age, city, url, userId]
    );
};

module.exports.checkLogin = (email) => {
    return db.query(`SELECT * FROM users WHERE email = $1;`, [email]);
};

module.exports.checkSignature = (id) => {
    return db.query(`SELECT id FROM signatures WHERE user_id = $1;`, [id]);
};

module.exports.signSupport = (signature, user_id) => {
    return db.query(
        `INSERT INTO signatures (signature, user_id) VALUES ($1, $2) RETURNING id;`,
        [signature, user_id]
    );
};

module.exports.getSignature = (id) => {
    return db
        .query(`SELECT signature FROM signatures WHERE id = $1;`, [id])
        .then((result) => {
            return result.rows[0].signature;
        });
};

module.exports.countSupports = () => {
    return db.query(`SELECT COUNT(*) FROM signatures;`).then((results) => {
        return results.rows[0].count;
    });
};

module.exports.displayInfo = (user_id) => {
    return db.query(
        `SELECT users.first AS user_firstname, users.last AS user_lastname, users.email AS user_email, user_profiles.age AS user_age, user_profiles.city AS user_city, user_profiles.url AS user_url
        FROM users
        LEFT JOIN user_profiles
        ON users.id = user_profiles.user_id
        WHERE users.id = $1;`,
        [user_id]
    );
};

module.exports.getSupporters = () => {
    return db.query(`
        SELECT users.first AS first, users.last AS last, user_profiles.age AS age, user_profiles.city AS city, user_profiles.url AS url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON user_profiles.user_id = signatures.user_id;
    `);
};

module.exports.supportersCity = (city) => {
    return db.query(
        `
        SELECT users.first AS user_firstName, users.last AS user_lastName, user_profiles.age AS user_age, user_profiles.city AS user_city, user_profiles.url AS user_url
        FROM users
        JOIN user_profiles
        ON users.id = user_profiles.user_id
        JOIN signatures
        ON user_profiles.user_id = signatures.user_id
        WHERE LOWER(user_profiles.city) = LOWER($1);
        `,
        [city]
    );
};

module.exports.deleteSignature = (user_id) => {
    return db.query(`DELETE FROM signatures WHERE user_id = $1;`, [user_id]);
};
