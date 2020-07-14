let mic, fft, coder,song

// switch mic on and off
let micSwitch = false;
let speakerSwitch = false;
let killSwitch = false;

// Decoded String
let payload = 0;
let monitor = []

// Sound generated is recorded as Buffer
var songBuffer = null;

var freqRanges = null;

let started = false;

let mail;


function clamp(value, min, max) {
    return min < max ?
        (value < min ? min : value > max ? max : value) :
        (value < max ? max : value > min ? min : value)
}

function bootstrap(cb) {
    getAudioContext().resume();
    mic = new p5.AudioIn()
    // mic.start()
    fft = new p5.FFT();
    fft.setInput(mic);
    mail = cb;
    started = true;
    setTimeout(() => {
        loop();
    }, 2000);
    // sound.amp(0.4);
}

function setup() {
    // CANVAS SETUP
    let cnv = createCanvas(1200, 600);
    //DECODER SETUP
    coder = new SonicCoder(window.PARAMS);
    noLoop();
}

function frequencyToIndex(frequency, frequencyBinCount) {
    var nyquist = sampleRate() / 2
    var index = Math.round(frequency / nyquist * frequencyBinCount)
    return clamp(index, 0, frequencyBinCount)
}

function indexToFreq(index, spectrum) {
    var nyquist = sampleRate() / 2;
    return nyquist / spectrum.length * index;
};

function draw() {
    if (started) {

        background(0);
        noStroke();
        fill(240, 150, 150);
        let spectrum = fft.analyze();
        // FIND MAXFREQUENCY -----------------------------------
        
        // GET ENERGY ARR
        // let testEnergyArr = freqRanges.map((x) => {
        //     return fft.getEnergy(x[0], x[1])
        // });
        

        let startIndex = frequencyToIndex(window.PARAMS.FREQMIN, spectrum.length) - 10;
        var max = -Infinity;
        var index = -1;
        for (var i = startIndex; i < spectrum.length; i++) {
            if (spectrum[i] > max) {
                max = spectrum[i];
                index = i;
            }
        }
        if (max > window.PARAMS.THRESHOLD) {

            let f = indexToFreq(index, spectrum);
            let alphabet = window.PARAMS.ALPHABET
            if (window.PARAMS.FREQMIN - f < window.PARAMS.FREQERR && f <= window.PARAMS.FREQMAX) {


                document.querySelector("#debugfreq").innerHTML = f;
                var decodedChar = coder.freqToChar(f);
                let curIndex = alphabet.indexOf(decodedChar);
                // Monitors for payload
                if(!monitor.includes(curIndex)){
                    if(monitor.length == 0){
                        console.log("Log at first Char",(+new Date()).toString().slice(9))
                    }
                    if(curIndex >= 0 && curIndex <= 9){
                        payload += 100*(curIndex)
                    } else if(curIndex >= 10 && curIndex <= 19){
                        payload += 10*(curIndex-10)
                    } else{
                        payload += (curIndex-20)
                    }
                    monitor.push(curIndex)
                    console.log("in",monitor)
                }
                

                if(monitor.length == 3){
                    console.log("Result:", payload)
                    payload = 0;
                    monitor = []
                }
            }
        }
        //FIND MAXFREQUENCY -----------------------------------

        //DRAW PEAKS
        for (var i = 0; i < spectrum.length; i++) {
            let x = map(i, 0, spectrum.length, 0, width);
            let h = -height + map(spectrum[i], 0, 255, height, 0);
            rect(x, height, width / spectrum.length, h)
        }
        endShape();
    }

}

// const getFreqRanges = () => {
//     var RANGE = window.PARAMS.FREQMAX - window.PARAMS.FREQMIN;
//     var INTERVAL = (RANGE / window.PARAMS.ALPHABET.length);
//     var FREQRANGES = [];
//     for (var i = 0; i < window.PARAMS.ALPHABET.length; i++) {
//         tempArr = [];
//         if (i == 0) {
//             tempArr.push(window.PARAMS.FREQMIN - PARAMS.FREQERR);
//             tempArr.push(PARAMS.FREQMIN + (Math.round((INTERVAL * 10) / 2) / 10));
//             FREQRANGES.push(tempArr);
//         } else if (i == 1) {
//             tempArr.push(FREQRANGES[i - 1][1])
//             tempArr.push(tempArr[0] + INTERVAL);
//             FREQRANGES.push(tempArr);
//         } else {
//             tempArr.push(FREQRANGES[i - 1][1]);
//             tempArr.push(tempArr[0] + INTERVAL);
//             FREQRANGES.push(tempArr);
//         }
//     }
//     return FREQRANGES;
// }
// freqRanges = getFreqRanges();


const switchMic = () => {
    if (micSwitch) {
        micSwitch = false;
        mic.stop();
    } else {
        micSwitch = true;
        mic.start();
    }
}


const switchSpeaker = () => {
    if (speakerSwitch) {
        song.stop();
        speakerSwitch = false;
    } else {
        speakerSwitch = true;
        if (songBuffer) {
            song = audioContext.createBufferSource();
            song.buffer = songBuffer;
            song.loop = true;
            song.connect(audioContext.destination);
            song.start();
        }
    }
}

// Prototype Switching Model 
// const callTimeout = (time1,time2) => {
//     if(!killSwitch) {                    // switch for killing this loop
//         switchSpeaker(); 
//         setTimeout(function() {
//             switchSpeaker();
//             switchMic();
//         },time1);

//         setTimeout(function(){
//             switchMic();
//             let T2 = getRndInteger(250, 350) * 10;
//             callTimeout(time1,T2);
//         },time1+time2);
//     }
// }
// callTimeout(500, 1500);

function getRndInteger(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
}

//REFERENCE
// ^ - 18050.1 - 18156.2  (106.1)
// A - 18156.3            (122.4)
// B - 18268.8
// C - 18381.3
// 1 - 18493.8
// 2 - 18606.3
// 3 - 18718.8
// $ - 18831.3