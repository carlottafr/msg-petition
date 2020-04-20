const supertest = require("supertest");
const { app } = require("./index");
const cookieSession = require("cookie-session");

// 1. Users who are logged out are redirected to
// the registration page when they attempt to go
// to the petition page.

test("GET /petition sends a 302 status code for logged-out users and redirects to '/register'", () => {
    const cookie = {};
    cookieSession.mockSessionOnce(cookie);
    return supertest(app)
        .get("/petition")
        .then((res) => {
            let redirectText = res.res.text;
            expect(res.statusCode).toBe(302);
            expect(redirectText).toBe("Found. Redirecting to /register");
        });
});

// 2. Users who are logged in are redirected to the
// petition page when they attempt to go to either
// the registration page or the login page.

test("GET /register sends a 302 status code for logged-in users and redirects to '/petition'", () => {
    const cookie = { user: { userId: 1 } };
    cookieSession.mockSessionOnce(cookie);
    return supertest(app)
        .get("/register")
        .then((res) => {
            let redirectText = res.res.text;
            expect(res.statusCode).toBe(302);
            expect(redirectText).toBe("Found. Redirecting to /petition");
        });
});

// 3. Users who are logged in and have signed the
// petition are redirected to the thank you page
// when they attempt to go to the petition page
// or submit a signature.

test("POST /petition sends a 302 status code for logged-in signers and redirects to '/thanks'", () => {
    const cookie = { user: { userId: 1, sigId: 1 } };
    cookieSession.mockSessionOnce(cookie);
    return supertest(app)
        .post("/petition")
        .then((res) => {
            let redirectText = res.res.text;
            expect(res.statusCode).toBe(302);
            expect(redirectText).toBe("Found. Redirecting to /thanks");
        });
});

// 4. Users who are logged in and have not signed
// the petition are redirected to the petition page
// when they attempt to go to either the thank you
// page or the signers page.

test("GET /thanks sends a 302 status code for logged-in non-signers and redirects to '/petition'", () => {
    const cookie = { user: { userId: 1 } };
    cookieSession.mockSessionOnce(cookie);
    return supertest(app)
        .get("/thanks")
        .then((res) => {
            let redirectText = res.res.text;
            expect(res.statusCode).toBe(302);
            expect(redirectText).toBe("Found. Redirecting to /petition");
        });
});
