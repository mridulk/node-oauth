const express = require('express');
const router = express.Router();
const { google } = require('googleapis');
const querystring =require('querystring')
const jwt =require('jsonwebtoken')
const axios = require('axios')
const {get} = require('lodash')
const {JWT_SECRET,GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET,COOKIE_NAME,SERVER_ROOT_URI,GITHUB_CLIENT_ID,GITHUB_CLIENT_SECRET,LINKEDIN_CLIENT_ID,LINKEDIN_CLIENT_SECRET}=process.env;

const oauth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  `${SERVER_ROOT_URI}/auth/google`
);


function getGoogleAuthURL() {
  const scopes = [
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ];

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: scopes, // If you only need one scope you can pass it as string
  });
}

//Login Url (google)

router.get('/google/url', (req, res) => {
    return res.send(getGoogleAuthURL());
});


//Access token from  user profile
router.get('/google', async (req, res) => {
    const code = req.query.code.toString();

    const { tokens } = await oauth2Client.getToken(code);

    // Fetch the user's profile with the access token and bearer
    const googleUser = await axios
      .get(
        `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${tokens.access_token}`,
        {
          headers: {
            Authorization: `Bearer ${tokens.id_token}`,
          },
        },
      )
      .then(res => res.data)
      .catch(error => {
          console.log("errors")
          console.log(error)
        throw new Error(error.message);
      });
    
    const token = jwt.sign(googleUser, JWT_SECRET);
    console.log("Token Here")
    console.log(token)
    res.cookie(COOKIE_NAME, token, {
      maxAge: 900000,
      httpOnly: true,
      secure: false,
    });
    //front end url here 
    res.send("User logged in via google")
    res.redirect(`${SERVER_ROOT_URI}/me`);
  });

//fetching user profile data
  router.get('/me',(req,res)=>{
    try {
        console.log("cookie")
        console.log(req.cookies[COOKIE_NAME])
        const decoded = jwt.verify(req.cookies[COOKIE_NAME], JWT_SECRET);
        console.log("decoded", decoded);
         res.send(decoded);
      } catch (err) {
        console.log(err);
        res.send(null);
      }
  })
  

  // Github Implementation  (getting token from query code)
  async function getGitHubUser({ code }) {
    const githubToken = await axios
      .post(
        `https://github.com/login/oauth/access_token?client_id=${GITHUB_CLIENT_ID}&client_secret=${GITHUB_CLIENT_SECRET}&code=${code}`
      )
      .then((res) => res.data)
                                                                                    
      .catch((error) => {
        console.log(error)
      });

    const decoded = querystring.parse(githubToken);
  
    const accessToken = decoded.access_token;
  
    return axios
      .get("https://api.github.com/user", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => res.data)
      .catch((error) => {
        console.error(`Error getting user from GitHub`);
        console.log(error)
      });
  }
  //Redirect uri : https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${gitHubRedirectURL}?path=${path}&scope=user:email
  //https://github.com/login/oauth/authorize?client_id=5b0c4b7f43c5f8a56e47&redirect_uri=http://localhost:3000/auth/github?path=/&scope=user:email

  router.get("/github", async (req, res) => {
    const code = get(req, "query.code");
    const path = get(req, "query.path", "/");
  
    if (!code) {
      throw new Error("No code!");
    }
    
    try{
      const gitHubUser = await getGitHubUser({ code })
      const token = jwt.sign(gitHubUser, JWT_SECRET);
  
      res.cookie(COOKIE_NAME, token, {
        maxAge: 900000,
        httpOnly: true,
        secure: false,
      });
    }
    catch(error){
      throw error
    }
   
  
   
    res.send("User Logged In via github")
    //frontend url here
    res.redirect(`http://localhost:3000/me`);
  });

  //Linkedin implementation
  //GET https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id={your_client_id}&redirect_uri={your_callback_url}&state=foobar&scope=r_liteprofile%20r_emailaddress%20w_member_social
  // client uri GET https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=86dmxy1ff3vg80&redirect_uri=http://localhost:3000/auth/linkedin&state=foobar&scope=r_liteprofile%20r_emailaddress%20w_member_social




  //get linkedin user from code
  async function getLinkedinUser({ code }) {
    const linkedinToken = await axios
      .post(
        `https://www.linkedin.com/oauth/v2/accessToken?grant_type=authorization_code&client_id=${LINKEDIN_CLIENT_ID}&client_secret=${LINKEDIN_CLIENT_SECRET}&code=${code}&redirect_uri=http://localhost:3000/auth/linkedin`
      )
      .then((res) => res.data)                                                                        
      .catch((error) => {
        console.log(error)
      });
      console.log("user")
      console.log(linkedinToken);
    const decoded = querystring.parse(linkedinToken);
    console.log("decoded token")
  console.log(decoded)
    const accessToken = linkedinToken.access_token;
  console.log("Access token")
  console.log(accessToken)
    return axios
      .get("https://api.linkedin.com/v2/me", {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      .then((res) => res.data)
      .catch((error) => {
        console.error(`Error getting user from GitHub`);
        
        throw error ;
      });
  }

  router.get('/linkedin',async (req,res)=>{
    const code = req.query.code;
    if (!code) {
      throw new Error("No code!");
    }
    console.log("code linkedin")
    console.log(code)
    
    const linkedinUser = await getLinkedinUser({ code });
  
    const token = jwt.sign(linkedinUser, JWT_SECRET);
    console.log("token")
    console.log(token);
    res.cookie(COOKIE_NAME, token, {
      maxAge: 900000,
      httpOnly: true,
      secure: false,
    });
    //frontend url here
    res.send("User logged in via linkedin")
    res.redirect(`http://localhost:3000/me`);
  })
module.exports = router;
