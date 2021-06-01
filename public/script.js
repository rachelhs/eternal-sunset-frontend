// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
var firebaseConfig = {
    apiKey: api_key,
    authDomain: "eternal-sunset.firebaseapp.com",
    databaseURL: "https://eternal-sunset-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "eternal-sunset",
    storageBucket: "eternal-sunset.appspot.com",
    messagingSenderId: "721854210888",
    appId: "1:721854210888:web:b6443f1e86c6a0095a097d",
    measurementId: "G-CHZCZD99S4"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

// get sunsets for today and tomorrow
const currentDate = dayjs(dayjs()).format('YYYY-MM-DD');
const tomorrowsDate = dayjs(dayjs().add(1, 'day')).format('YYYY-MM-DD');
let soonest_sunset_name = "";
const sunsetTimes = [];
const sunsetIndexs = [];

// 2. This code loads the IFrame Player API code asynchronously.
let tag = document.createElement('script');

tag.src = "https://www.youtube.com/iframe_api?autoplay=1";
tag.allow = "autoplay";
let firstScriptTag = document.getElementsByTagName('script')[0];
firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
let state = -1;
let startCamIndex = 0;
let nextSunset;
let timeout;

soonestSunset = () => {
    startCamIndex = 0;
    // find soonest sunset
    sunsetTimes.forEach((sunsetTime) => {
        let timeDiff = dayjs(sunsetTime).diff(dayjs());
        // find soonest positive time difference
        // API error returns negative time of 1st Jan 1970 - discount this by accepting > -1000000000000 time difference
        if (timeDiff < 0 && timeDiff > -1000000000000) {
            startCamIndex = sunsetTimes.indexOf(sunsetTime);
        }
    });
    // start the cams at first non - negative time difference
    console.log('soonest sunset found');
    return startCamIndex;
}

onYouTubeIframeAPIReady = () => {
    player = new YT.Player('sunset-cam', {
        height: '390',
        width: '640',
        videoId: '',
        playerVars: {
            'playsinline': 1,
            'autoplay': 1,
            'mute': 1
        },
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// 4. The API will call this function when the video player is ready.
onPlayerReady = (event) => {
    console.log('soonest sunset', nextSunset);
    // after 5 seconds, check to see if video is working
    setTimeout(() => { checkState() }, 5000);
};

// checks if video is playing
checkState = (event) => {
    console.log('checking video...');
    if (state == 1) {
        console.log('video working');
        // do nothing
    }
    else {
        console.log('video not working, next');
        // skip to next video
        console.log('soonest sunset', nextSunset);
        clearTimeout(timeout);
        nextSunset += 1;
        playVideo();
    }
}

playVideo = () => {
    console.log('playVideo');
    // check video is playing
    setTimeout(() => { checkState(); }, 5000);
    firebase.database().ref(`${nextSunset}`).once('value', (snap) => {
        let embed = snap.val().URL;
        id = embed.split('/embed/')[1];
        console.log(id);
        player.loadVideoById({ 'videoId': id });
    })
    // time until next cam (when sun sets at current one)
    let currentSunsetCountdown = dayjs(sunsetTimes[nextSunset]).diff(dayjs());
    let currentSunsetCountdownMins = currentSunsetCountdown / 60000;
    console.log("sun setting in ", currentSunsetCountdownMins, "minutes");
    timeout = setTimeout(() => {
        nextSunset += 1;
        playVideo();
    }, currentSunsetCountdown);
}

// updates state of video globally - playing or not playing
onPlayerStateChange = (event) => {
    if (event.data == 1) {
        state = 1;
    }
    else {
        state = -1;
    }
    console.log('state', state);
}

// make an ordered array of sunset times and the index number their webcam
orderSunset = () => {
    let sunsetToday = firebase.database().ref(`sunsets/${currentDate}`);
    sunsetToday.orderByValue().on("value", (snapshot) => {
        snapshot.forEach((data) => {
            sunsetTimes.push(data.val());
            sunsetIndexs.push(data.key);
        });
    });
    let sunsetTomorrow = firebase.database().ref(`sunsets/${tomorrowsDate}`);
    sunsetTomorrow.orderByValue().on("value", (snapshot) => {
        snapshot.forEach((data) => {
            sunsetTimes.push(data.val());
            sunsetIndexs.push(data.key);
        })
    })
    console.log('sunsets in order');
};

orderSunset();
setTimeout(() => {
    nextSunset = soonestSunset();
}, 1000);