class Slideshow {
  render(component,results) { 
    const height = component.height || "320px";   
    const width = component.width || "480px";   
    const slideshow = solidUI.createElement('DIV','','',`height:${height};width:${width};text-align:center`);
    let i = 0;
    for(let row of results){
      let slide = solidUI.createElement('DIV','mySlides','');
      let img = solidUI.createElement('IMG','','',`height:${height};max-width:${width}`)
      const label = solidUI.createElement('DIV','',row.label)
      img.src = row.image;
      if(i) slide.style.display="none";
      i++;
      slide.appendChild(img);
      slide.appendChild(label);
      slideshow.appendChild(slide);
    }
    const prev = solidUI.createElement('A','','&#10094;',"cursor:pointer");
    const next = solidUI.createElement('A','','&#10095;',"cursor:pointer");
    const play = solidUI.createElement('A','','\u23f5',"font-size:2rem;font-weight:bold;cursor:pointer;");
    const pause = solidUI.createElement('A','','\u23f8','font-size:2rem;font-weight:bold;cursor:pointer;display:none;');
 //   prev.onclick=(event)=>{changeSlide(event,-1)};
 //   next.onclick=(event)=>{changeSlide(event,1)};
    play.onclick=(event)=>{playSlides(event,pause,play)};
    play.title="play slides";
    pause.title="pause slides";
    pause.onclick=(event)=>{pauseSlides(event,pause,play)};
//    slideshow.appendChild(prev);
    slideshow.appendChild(play);
    slideshow.appendChild(pause);
//    slideshow.appendChild(next);
    return slideshow  
  }
}   // end class Slideshow

var slideIndex = 1;
var paused = false;

function changeSlide(event,n) {
  paused = true;
  showSlidesManual(event,slideIndex += n);
}

function showSlidesManual(event,n) {
  var i;
  var slides = document.querySelectorAll(".mySlides");
  if (n > slides.length) {slideIndex = 1}
  if (n < 1) {slideIndex = slides.length}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
  }
  slides[slideIndex-1].style.display = "block";
}
function pauseSlides(event,pause,play) {
  paused=true;
  play.style.display="block";
  pause.style.display="none";  
}
function playSlides(event,pause,play){
  play.style.display="none";
  pause.style.display="block";  
  paused = false; 
  showSlides();
}

function showSlides() {
    var i;
    var slides = document.getElementsByClassName("mySlides");
    for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";
    }
    slideIndex++;
    if (slideIndex > slides.length) {slideIndex = 1}
    slides[slideIndex-1].style.display = "block";
    if(!paused)
      setTimeout(showSlides, 2000); // Change image every 2 seconds
  }