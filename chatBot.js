const express = require("express");
const { WebhookClient } = require("dialogflow-fulfillment");
const { Payload } =require("dialogflow-fulfillment");
const app = express();

const MongoClient = require('mongodb').MongoClient;
var url = "mongodb://localhost:27017/";
var randomstring = require("randomstring"); 
var user_name="";

app.post("/dialogflow", express.json(), (req, res) => {
    const agent = new WebhookClient({ 
		request: req, response: res 
		});

async function identify_user(agent)
{
  const name = agent.parameters.phone_number;
  // console.log(name);
  const  password= agent.parameters.password;
  // console.log(password);
  const client = new MongoClient(url);
  await client.connect();
  const snap = await client.db("CHATBOT").collection("USERINFO").findOne({"acct_num":name,"password":password});
  console.log(snap);
  if(snap==null){
	  await agent.add("Please, Check your username and password.");

  }
  else
  {
    const count = await client.db("CHATBOT").collection("LOGINCOUNT").findOne({"acct_num":snap.acct_num});
    console.log(count);
    const no=count.times;
    // console.log(no); 
    await client.db("CHATBOT").collection("LOGINCOUNT").updateOne({"acct_num":snap.acct_num},{$set:{times:no+1}});
    user_name=snap.username;
    // console.log(user_name);
    await agent.add("Welcome  "+user_name+"!!  \n How can I help you");}
}
	
async function report_issue(agent) 
{
 
  var issue_vals={1:"Internet Down",2:"Slow Internet",3:"Buffering problem",4:"No connectivity",5:"Sudden Disconnectivity",6:"Drop in speed"};
  
  const intent_val=agent.parameters.number;
  // console.log(intent_val)
  var val=issue_vals[intent_val];
  
  var trouble_ticket=randomstring.generate(7);

  //Generating trouble ticket and storing it in Mongodb
  //Using random module
  MongoClient.connect(url, function(err, db) {
  if (err) throw err;
  var dbo = db.db("CHATBOT");
    
	var u_name = user_name;    
    var issue_val=  val; 
    var status="pending";

	let ts = Date.now();
    let date_ob = new Date(ts);
    let date = date_ob.getDate();
    let month = date_ob.getMonth() + 1;
    let year = date_ob.getFullYear();

    var time_date=year + "-" + month + "-" + date;
    if(0<intent_val<=6)
    {

  	var myobj = { username:u_name, issue:issue_val,status:status,time_date:time_date,trouble_ticket:trouble_ticket };

    dbo.collection("STATUS").insertOne(myobj, function(err, res) {
    if (err) throw err;
    db.close();    
  });
}
 });
 if(intent_val>6 || intent_val<0)
 {
 await agent.add("Enter correct Issue number");
}
else{
  agent.add("The issue reported is: "+ issue_vals[intent_val] +"\nThe ticket number is: "+trouble_ticket+"\nMake Note of the ticket number");
}
}

//trying to load rich response
function custom_payload(agent)
{
	var payLoadData=
		{
  "richContent": [
    [
      {
        "type": "list",
        "title": "Internet Down",
        "subtitle": "Press '1' for Internet is down",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Slow Internet",
        "subtitle": "Press '2' Slow Internet",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
	  {
        "type": "divider"
      },
	  {
        "type": "list",
        "title": "Buffering problem",
        "subtitle": "Press '3' for Buffering problem",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "No connectivity",
        "subtitle": "Press '4' for No connectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Sudden Disconnectivity",
        "subtitle": "Press '5' for Sudden Disconnectivity",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      },
      {
        "type": "divider"
      },
      {
        "type": "list",
        "title": "Drop in speed",
        "subtitle": "Press '6' for drop in speed",
        "event": {
          "name": "",
          "languageCode": "",
          "parameters": {}
        }
      }
    ]
  ]
}
agent.add(new Payload(agent.UNSPECIFIED,payLoadData,{sendAsMessage:true, rawPayload:true }));
}




var intentMap = new Map();
intentMap.set("Service_intent", identify_user);
intentMap.set("Service_intent-custom-custom", report_issue);
intentMap.set("Service_intent-custom", custom_payload);

agent.handleRequest(intentMap);

});//Closing tag of app.post

console.log("Listen on ",8080);
app.listen(process.env.PORT || 8080);

