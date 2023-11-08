import { DOC_URL,CHAT_URL,AUTH_URL } from "./ep.js";

let docurl = "";
let isCleared = false;
chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    let activeTab = tabs[0];
    docurl = activeTab.url;
  });
  function senderm(){
    let inp = $("#textmsg").val();
    if(inp=="") return;
    sendchat(inp);
    $("#textmsg").val("");
  }
$("#sender").on("click",function(){
    senderm();
});
$("#textmsg").on('keypress',function(e) {
    if(e.which == 13) {
        senderm();
    }
});
$(".clearmsg").on("click",function(){
   clearChat();
   isCleared = true;
});
function randchars(){
  return  Math.random().toString(36).slice(2);
}
 function template(type,time,msg,id=randchars(),hideicon=false){
    let temp =`<div class="${type}">
    <img src="./images/${type=='bot'?'icon2.png':'user.png'}" />
    <div>
        <div id="${id}">${msg}</div>
        <div>${time}</div>
    </div>
    ${type=='bot' && hideicon==false ? '<div class="copierp"><img data-clipboard-target="#'+id+'" class="copier" src="./images/copy.png"/></div>' : ''}
       </div>`;
       return temp;
 }
function botresp(){
    $("#allchats").append(template('bot','','<div class="lds-ellipsis"><div></div><div></div><div></div><div></div></div>','',true));
    $('#allchats').scrollTop($('#allchats')[0].scrollHeight);
}
let chats=[
];
function formatAMPM(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12; 
    minutes = minutes < 10 ? '0'+minutes : minutes;
    let strTime = hours + ':' + minutes + ' ' + ampm;
    return strTime;
  }
function showToast(msg) {
    $("#snackbar").text(msg);
    let x = document.getElementById("snackbar");
    x.className = "show";
    setTimeout(function(){ x.className = x.className.replace("show", ""); }, 3000);
  }
  function err_msg(title="",content=""){
    $("#processing").hide();
    $("#error").show();
    $("#errtitle").text(title);
    $("#errmessage").html(content);

  }
  function reformBot_resp(msg){
    const fm  = msg.split("\n");
              let fn="";
              let counter=0;
              fm.forEach((item,index)=>{
                if(item.endsWith("?")){
                  if(counter==0) fn+="<ol style='padding-left: 15px;'>";
                  fn+=`<li class='extractor'>${item.substring(3)}</li>`;
                  counter+=1;
                  if(counter==3) fn+="</ol>";
                }else{
                  if(item==""){
                    fn+=`<div style="height:16px">${item}</div>`;
                  }else{
                    fn+=`<div>${item}</div>`;
                  }
                }
                

              })
              return fn;
  }
function loadchat(){
    let allchats ="";
    let lastid="";
    let ind=0;
    chats.forEach(function(item,index){
    let id=randchars();
    lastid=id;
    ind=index;
    let themsg = "";
    if(index==0 && isCleared==false){
      themsg = reformBot_resp(item.message);
    }else{
      if(isCleared==true && index==1){
        themsg = reformBot_resp(item.message);
      }else{
        themsg = item.message;
      }
    }
    allchats+=template(item.type,item.time,themsg,id);

    });
    $("#allchats").html(allchats);
    $('#allchats').scrollTop($('#allchats')[0].scrollHeight);
    $(".extractor").on("click",function(){
      const val = $(this).text();
      $("#textmsg").val(val);
      $("#textmsg").focus();
    });
    let clipboard = new ClipboardJS('.copier');
    clipboard.on('success', function(e) {
       
        showToast("Copied");
        e.clearSelection();
    });
    
    return {
        lastid:lastid,
        index:ind
    };
}
function newMessage(type,message,time=formatAMPM(new Date())){
let msg = {
    type:type,
    time:time,
    message:message
}
chats.push(msg);
let lid =  loadchat();
return lid;
}
async function init(){
    let status = await validate_user();

    if(status==true){
        if(localStorage.getItem(docurl)!=null){
            let td = JSON.parse(localStorage.getItem(docurl));
            let docid = td.docid;
            let chatid = td.chatid;
           
            let st =  await get_chats(chatid);
            if(st==false){
         
            docid = await get_doc_id();
            if(docid==false)return;
            chatid = await create_chat_id();
            await startchat(docid,chatid); 
            }
        }else{
      let docid = await get_doc_id();
      if(docid==false)return;
      let chatid = await create_chat_id();
      await startchat(docid,chatid);
        }
    
        $("#processing").hide();
        $("#done").show();
        loadchat();
      
    }else{
        $("#processing").hide();
        $("#signin").show();
        $("#errtitle").text("There was a problem logging you in");
        $("#errmessage").text("Looks like something went wrong and we can't log you in at the moment. Please try again or read our guide");
    }
}
async function validate_user(){
    if(localStorage.getItem("TOKEN")==null){
     return false;
    }
    let token = JSON.parse(localStorage.getItem("TOKEN"));
  
    let data = '';
      
      let config = {
        method: 'get',
        url: `${AUTH_URL}/users/me`,
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json', 'Application':'extension',
          'Authorization': 'Bearer '+token.access_token
        },
        data : data
      };
      
      let resp = await axios(config).catch(function (error) {
       
        
      });
      
      if(resp == undefined){
        let st= await refresh_user();
       
        return st;
      }
  
      return true;

}
async function refresh_user(){
    let token = JSON.parse(localStorage.getItem("TOKEN"));
  
    let data = JSON.stringify({
        "refresh_token": token.refresh_token
      });
      
      let config = {
        method: 'post',
        url: '${AUTH_URL}/auth/token-refresh',
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json', 'Application':'extension',
        },
        data : data
      };
      
      let resp = await axios(config).catch(function (error) {
       

      });
      if(resp == undefined) return false;
      token.access_token = resp.data.access_token;

      localStorage.setItem("TOKEN",JSON.stringify(token));
      return true;

}
async function get_doc_id(){
   
    if(!docurl.startsWith("http")){
      const d = await upload_local_file();
      return d;
    }

    let data={};
    let token = JSON.parse(localStorage.getItem("TOKEN"));
    let config = {
        method: 'post',
        url: docurl.toString().endsWith(".pdf") ? `${DOC_URL}/api/download_pdf?url=${docurl}` : `https://pro.askyourpdf.com/api/download_pdf?url=${docurl}` ,
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json', 'Application':'extension',
          'Authorization': 'Bearer '+token.access_token
        },
        data : data
      };
      
      let rep = await axios(config).catch(function (error) {
        err_msg("Error loading document.",error.response.data.detail);
      });
      //alert(rep);
      if(rep!=undefined){
        return rep.data.docId;
      }else{
        return false;
      }
}
async function upload_local_file(){
  let token = JSON.parse(localStorage.getItem("TOKEN"));
  const data = await fetch(docurl);
  const blob = new Blob([await data.blob()]);
  const formData = new FormData();
formData.append('file', blob, docurl);
var myHeaders = new Headers();
myHeaders.append("Accept", "application/json");
myHeaders.append("Application", "extension");
myHeaders.append("Authorization", "Bearer "+token.access_token);

var formdata = new FormData();
formdata.append("file", blob, docurl);

var requestOptions = {
  method: 'POST',
  headers: myHeaders,
  body: formdata,
  redirect: 'follow'
};

const res = await fetch(`${DOC_URL}/api/upload`, requestOptions);
if(res.ok){
  const docid = await res.json();
  return docid.docId;
}else{
  const err = await res.json();
  err_msg("Error loading document",err.detail)
  return false;
}
}
async function startchat(doc,chid){
    let token = JSON.parse(localStorage.getItem("TOKEN"));
    let data = JSON.stringify({
        "message": ""
      });
      
      let config = {
        method: 'post',
        responseType: 'stream',
        url: `${CHAT_URL}/chat/${doc}?chat_id=${chid}`,
        headers: { 
          'Content-Type': 'application/json', 
          'Accept': 'application/json', 'Application':'extension',
          'Authorization': 'Bearer '+token.access_token
        },
        data : data
      };
      
  
      let myHeaders = new Headers();
      myHeaders.append("Content-Type", "application/json");
      myHeaders.append("Accept", "application/json");
      myHeaders.append("Application", "extension");
      myHeaders.append("Authorization", "Bearer "+token.access_token);
      
      let raw = "";
      
      let requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: raw,
        redirect: 'follow'
      };
      
      let resp = await fetch(`${CHAT_URL}/chat/${doc}?chat_id=${chid}`, requestOptions).catch(error => {});
    
      if(resp!=undefined){
        $("#processing").hide();
        $("#done").show();
      
        
        let dc = new TextDecoder();
        const reader = resp.body.getReader();
        let ctx="";
        let lastidk = newMessage('bot',ctx);
       
        while (true) {
            
            const {value, done} = await reader.read();
            if (done) break;
            ctx = chats[lastidk.index].message;
            ctx+=dc.decode(value);
            chats[lastidk.index].message = ctx;
            loadchat();
          }
         
      localStorage.setItem(docurl,JSON.stringify({
        chatid:chid,docid:doc
      }));
      }
}
async function create_chat_id(){
    let token = JSON.parse(localStorage.getItem("TOKEN"));
    let data = '';

let config = {
  method: 'get',
  url: `${CHAT_URL}/chat`,
  headers: { 
    'Content-Type': 'application/json', 
    'Accept': 'application/json', 'Application':'extension',
    'Authorization': 'Bearer '+token.access_token
  },
  data : data
};

let resp = await axios(config).catch(function (error) {
err_msg("Error loading document");
if(typeof error.response.data.detail == 'string'){
err_msg("Error loading document",error.response.data.detail);
}else{
err_msg("Error loading document","Error loading document");
}

});
return resp.data.chat_id;
}
async function get_chats(chatid){
    let token = JSON.parse(localStorage.getItem("TOKEN"));
    let data = '';

    let config = {
      method: 'get',
      url: `${CHAT_URL}/conversations/${chatid}?page=1&page_size=100`,
      headers: { 
        'Content-Type': 'application/json', 
        'Accept': 'application/json', 'Application':'extension',
        'Authorization': 'Bearer '+token.access_token
      },
      data : data
    };
    
    let resp = await axios(config).catch(function (error) {

    });
    if(resp!=undefined){
        //let dchats = resp.chat_history;
        resp.data.chat_history.forEach(function(item,index){
            let tim = formatAMPM(new Date(item.date_time));
            if(item.question!==""){
            let dfdata = {
                type:'user',
                time:tim ,
                message:item.question
            }
            chats.push(dfdata);
        }
           let dfdata = {
                type:'bot',
                time:tim ,
                message:item.answer
            }
            
            chats.push(dfdata);
        });

    }else{
    return false;
    }
}
async function schatapi(msg){
  let td = JSON.parse(localStorage.getItem(docurl));
  let docid = td.docid;
  let chatid = td.chatid;
let token = JSON.parse(localStorage.getItem("TOKEN"));
let data = JSON.stringify({
"message": msg
});
  let myHeaders = new Headers();
  myHeaders.append("Content-Type", "application/json");
  myHeaders.append("Accept", "application/json");
  myHeaders.append("Application", "extension");
  myHeaders.append("Authorization", "Bearer "+token.access_token);
  
  let raw = data;
  
  let requestOptions = {
    method: 'POST',
    headers: myHeaders,
    body: raw,
    redirect: 'follow'
  };
  try{
  let resp = await fetch(`${CHAT_URL}/chat/${docid}?chat_id=${chatid}`, requestOptions).catch(error => {});

  return resp;
  }catch(error){
   
    return undefined;
  }
}
async function sendchat(msg){
    newMessage('user',msg);


      botresp();
      try{
          let resp = await schatapi(msg);
          if(resp.ok){
        let dc = new TextDecoder();
        const reader = resp.body.getReader();
        let ctx="";
        let lastidk = newMessage('bot',ctx);
       
        while (true) {
            
            const {value, done} = await reader.read();
            if (done) break;
            ctx = chats[lastidk.index].message;
            ctx+=dc.decode(value);
            chats[lastidk.index].message = ctx;
            loadchat();
          }
        }else{
          $("#done").hide();
          err_msg("Daily Quota Exausted","Please subscribe to a premium plan to continue using AskyYorPDF <a style='color:inherit' href='https://askyourpdf.com'><b>Click here to subscribe</b></a> or contact support")
        }
        }catch(error){
          try{
            chats.splice(lastidk.index,1);
            loadchat();
      
          botresp();
          let resp = await schatapi(msg);
          const reader = resp.body.getReader();
          let lastidk = newMessage('bot',ctx);
        while (true) {
            
            const {value, done} = await reader.read();
            if (done) break;
            ctx = chats[lastidk.index].message;
            ctx+=dc.decode(value);
            chats[lastidk.index].message = ctx;
            loadchat();
          }
        }catch(err){
          chats[lastidk.index].message = "Sorry there have been an error, please re-type your last question";
          loadchat();
        }
       
     
    }
 
}
async function clearChat(){
    chats=[];
    loadchat();
    if(localStorage.getItem(docurl)==null) return;
   let chatid = await create_chat_id();
    let td = JSON.parse(localStorage.getItem(docurl));
    td.chatid = chatid;
    localStorage.setItem(docurl,JSON.stringify(td));
   
}
init();
$(".closer").on("click",function(){
parent.postMessage("ayp-close","*");
});

chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
 
    $("#signin").hide();
    $("#error").hide();
    $("#done").hide();
    $("#processing").show();
    
    init();
});