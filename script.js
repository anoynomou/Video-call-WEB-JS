
   const socket = io.connect("https://chat-s-app.herokuapp.com/");



let localstreem , remotestreem ;
let PeerConnection; 
const server = {
    iceServers:[
             {
           urls:'stun:stun.callwithus.com:3478'
       },
       {
          urls:"stun:stun1.l.google.com:19302"
       }

       
    ]
}
let constraints = { audio: true, video:true}


var MyVideo = document.getElementById("myVideo")
var OtherVideo = document.getElementById("mainVideo")


var CALL_BUTTON = document.getElementById("call_button")
var AUDIO_BUTTON = document.getElementById("audio_button")
var VIDEO_BUTTON = document.getElementById("video_button")

StartVideoCall()

CALL_BUTTON.addEventListener("click",()=>{

if(CALL_BUTTON.style.color === "green"){
    CALL_BUTTON.style.color = "red"
    createOffer()
}else{
    CALL_BUTTON.style.color = "green"
}


})
AUDIO_BUTTON.addEventListener("click",()=>{
    if(AUDIO_BUTTON.getAttribute("class") === "fas fa-microphone-alt"){
        
        AUDIO_BUTTON.style.color ="red"
        AUDIO_BUTTON.setAttribute("class","fas fa-microphone-alt-slash")
        MyVideo.muted =true
        
    }else{
          MyVideo.muted =false
        AUDIO_BUTTON.setAttribute("class","fas fa-microphone-alt");
        AUDIO_BUTTON.style.color ="green"
    }

})
VIDEO_BUTTON.addEventListener("click",()=>{
    if(VIDEO_BUTTON.getAttribute("class") === "fas fa-video"){
        VIDEO_BUTTON.setAttribute("class","fas fa-video-slash")
        VIDEO_BUTTON.style.color ="red"
      
       MyVideo.pause()

    }else{
        MyVideo.play()
        VIDEO_BUTTON.setAttribute("class","fas fa-video");
        VIDEO_BUTTON.style.color ="green"
    }
})





async function StartVideoCall(){ 
    localstreem = await navigator.mediaDevices.getUserMedia(constraints)
    MyVideo.srcObject =localstreem
}



socket.on("msg",(data)=>{
    HandleConnection(data)
})


let HandleConnection =async (message)=>{

    message = JSON.parse(message)
    console.log(message);
    if(message.type === "offer"){
     
      createAnswer(message.offer)
    }
    if(message.type === "answer"){

        addAnswer(message.answer)
    }
    if(message.type === "candidate"){
        if(PeerConnection){
            
            PeerConnection.addIceCandidate(message.candidate)
        }
    }

}
function SendMessage(message){
    socket.emit("msg",message)
}



let createPeerconnection =async ()=>{
    PeerConnection = new RTCPeerConnection(server)
    remotestreem = new MediaStream()
    OtherVideo.srcObject = remotestreem


    if(!localstreem){
        localstreem = await navigator.mediaDevices.getUserMedia(constraints)
        MyVideo.srcObject =localstreem
    }

    localstreem.getTracks().forEach((track)=>{
        PeerConnection.addTrack(track,localstreem)
    })

    PeerConnection.ontrack = (event)=>{
        event.streams[0].getTracks().forEach((track)=>{
            remotestreem.addTrack(track)
        })
    }

    PeerConnection.onicecandidate = async (event) =>{
        if(event.candidate){
            
            SendMessage(JSON.stringify({"type":"candidate","candidate":event.candidate}))

        }
    }

}


let createOffer = async ()=>{
    await createPeerconnection()
    let offer = await PeerConnection.createOffer()
    await PeerConnection.setLocalDescription(offer)
    
    SendMessage(JSON.stringify({"type":"offer","offer":offer}))
}


let createAnswer = async (offer)=>{
    await createPeerconnection()
    await PeerConnection.setRemoteDescription(offer)
    let answer = await PeerConnection.createAnswer()
    await PeerConnection.setLocalDescription(answer)
    SendMessage(JSON.stringify({"type":"answer","answer":answer}))
}

let addAnswer = async (answer)=>{
    if(!PeerConnection.currentRemoteDescription){
        PeerConnection.setRemoteDescription(answer)
    }
}

