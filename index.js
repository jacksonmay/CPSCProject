const nodemailer = require('nodemailer');
const SqlString = require('sqlstring');
const mariadb = require('mariadb')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.set('view engine', 'ejs')
app.use(express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }))
const port = 8080
const pool = mariadb.createPool({
  host: 'database-1.crhpufzl7imq.us-east-2.rds.amazonaws.com',
  user: 'admin',
  password: 'NikeLover55!',
  database: 'cpsc_data',
  port: 3308
})

var users
var employeeLogin = false

app.get('/', (req, res) => {
  res.render('home')
})

app.get('/createAccount', (req, res) => {
  res.render('createAccount')
})

app.get('/listingsTable', (req, res) => {
  res.render('listingsTable')
})

app.get('/login', (req, res) => {
  res.render('login')
})

app.get('/forgotPass', (req, res) => {
  res.render('forgotPass')
})

app.get('/submitInvestigation', (req, res) => {
  res.render('submitInvestigation')
})

app.get('/analytics', (req, res) => {
  res.render('analytics')
})

app.get('/about', (req, res) => {
  res.render('about')
})

app.get('/contact', (req, res) => {
  res.render('contact')
})


app.get('/openInvestigations', async (req, res) => {
  if (employeeLogin == false) {
    try {
      var conn = await pool.getConnection();
      var investigations = await conn.query('SELECT * FROM Violation')
      conn.release()
      res.render('openInvestigations', {data : investigations})
    }
    catch(err) {
      conn.release()
      console.log(err)
    }
  } else {
    try {
      var conn = await pool.getConnection();
      var investigations = await conn.query('SELECT * FROM Violation')
      conn.release()
      res.render('employeeInvestigations', {data : investigations})
    }
    catch(err) {
      conn.release()
      console.log(err)
    }
  }
  
  
})

app.post('/login', async (req, res) => {
  users = await main()

  var found = false
  users.forEach(user => {
    if (user.UserName === req.body.username && user.Password === req.body.password) {
      found = true
    }
  })
  if (found) {
    employeeLogin = true;
    res.render('home')
  } else {
    res.render('login', { message : 'Incorrect Login Credentials', color : 'red' })
  }
  console.log('Got body:', req.body);
})



app.post("/createAccount", async (req, res) => {
  try {
    var username = SqlString.escape(req.body.username);
    var firstName = SqlString.escape(req.body.firstname);
    var lastName = SqlString.escape(req.body.lastname);
    var password = SqlString.escape(req.body.password);
    var reenterPassword = SqlString.escape(req.body.reenterPassword);
    var email = SqlString.escape(req.body.email);
    
    console.log(req.body)
    if (password === reenterPassword) {
      var conn = await pool.getConnection()
      var newUser = await conn.query(`INSERT INTO cpsc_employee (UserName, FirstName, LastName, Password, Email) VALUES (${username}, ${firstName}, ${lastName}, ${password}, ${email})`)
      conn.release()
      console.log(newUser)
      return res.render('login', { message : 'Your account has been created successfully!', color : '#41fc03'})
    } else {
      res.render('createAccount', { message : 'Your passwords do not match!'})
    }
  } 
  catch (err) {
    conn.release()
    console.log(err)
  }
})

var codes = []

app.post("/forgotPass", async (req, res) => {
  try {
    var codePair = {email : req.body.recoveryEmail, code : Math.floor(100000 + Math.random() * 900000)}
    codes.push(codePair)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'cpscloginhelp@gmail.com',
        pass: 'cpscproject'
      }
    });
    
    const mailOptions = {
      from: 'cpscloginhelp@gmail.com',
      to: codePair.email,
      subject: 'CPSC Password Recovery',
      text: `Your recovery code is: ${codePair.code}`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
      console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });

    return res.render('enterCode', {email : codePair.email})

  } 
  catch (err) {
 
  }
})

app.post("/enterCode", async (req, res) => {
  try {
    var userPair = codes.find(code => code.email === req.body.email)
    console.log(userPair)
    if (req.body.code == userPair.code) {
      return res.render('changePass', {email : req.body.email})
    } else {
      return res.render('enterCode', { message : 'The code you have entered is incorrect. Please try again.', email : req.body.email})
    }

  } 
  catch (err) {
 
  }
})

app.post("/changePass", async (req, res) => {
  try {
    var password = SqlString.escape(req.body.password)
    var reenterPassword = SqlString.escape(req.body.reenterPassword)
    var email = SqlString.escape(req.body.email)
    
    if (password === reenterPassword) {
      console.log('inside if ')
      var conn = await pool.getConnection()
      var passChange = await conn.query(`UPDATE cpsc_employee SET Password = ${password} WHERE Email = ${email};`)
      conn.release()
      console.log('released')
      return res.render('login', { message : 'Your password has successfully been changed.', color : '#41fc03' })
    } else {
      return res.render('changePass', { message : 'Your passwords do not match. Please try again.'})
    }   
  }
  catch (err) {
    console.log(err)
  }
})

app.post("/submitInvestigation", async (req, res) => {
  try {
    var description = SqlString.escape(req.body.investigationDesc);
    var productName = SqlString.escape(req.body.productName);
    var productBrand = SqlString.escape(req.body.productBrand);
    var customerEmail = SqlString.escape(req.body.customerEmail);

    let today = new Date().toISOString().slice(0, 10)


    


    console.log(req.body)
    var conn = await pool.getConnection()
    var newViolation = await conn.query(`INSERT INTO Violation (ViolationResponse, ProductName, ProductSeller, CustomerEmail) VALUES (${description}, ${productName}, ${productBrand}, ${customerEmail})`)
    var emails = await conn.query(`SELECT Email FROM cpsc_employee`)
    var emailsArray = emails.map(e => e.Email)
    conn.release()
    console.log(newViolation)
    console.log(emailsArray)
    
    
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'CPSCautomated@gmail.com',
        pass: 'CPSCEmployee123@'
      }
    });
    
    const mailOptions = {
      from: 'CPSCautomated@gmail.com',
      to: emailsArray,
      subject: 'New Violation Report',
      text: `A new violaton report has been published. Product Name: ${productName} Product Brand: ${productBrand} Submitter Email: ${customerEmail} Description: ${description} This email was generated automatically. Please submit all inquiries to info@cpsc.gov.`
    };
    
    transporter.sendMail(mailOptions, function(error, info){
      if (error) {
      console.log(error);
      } else {
        console.log('Email sent: ' + info.response);
      }
    });
    
    
    return res.render('submitInvestigation', { message : 'Thank you for your report. A CPSC employee will look into the matter shortly.', color : '#41fc03'})
    
  } 
  catch (err) {
    conn.release()
    console.log(err)
  }
})

app.post("/employeeInvestigations", async (req, res) => {
  try {
    var index = 4001 + parseInt(req.body.index);

    console.log(req.body)
    var conn = await pool.getConnection();
    var investigations = await conn.query('SELECT * FROM Violation')
    var update = await conn.query(`UPDATE Violation SET RU = 'R' WHERE VID = ${index}`)
    conn.release()
    res.render('employeeInvestigations', {data : investigations})
  } 
  catch (err) {
    conn.release()
    console.log(err)
  }
})

async function main(){
  try {
    var conn = await pool.getConnection();
    var employees = await conn.query('SELECT * FROM cpsc_employee')
    conn.release()
    return employees
  }
  catch(err) {
    conn.release()
    console.log(err)
  }
}

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`)
})