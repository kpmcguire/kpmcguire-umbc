import '../scss/app.scss'
import '../pug/index.pug'
import {debounce, throttle} from './utils'
import {data} from './data'

const bp_md = 768

// Babel Polyfill
import 'core-js/stable'
import 'regenerator-runtime/runtime'

// add some variables for dom manipulation
const toggler = document.querySelector('#toggle-navigation')
const main_navigation = document.getElementById('main-navigation')
const social_navigation = document.getElementById('social-media-container')
const searchbox = document.getElementById('search')
const search_results = document.getElementById('search-results')
const search_button = document.querySelector('.toggle-search-button')
const search_wrapper = document.querySelector('.search-wrapper')
const social_placeholder_upper = document.querySelector('.social-media-placeholder-upper')
const social_placeholder_lower = document.querySelector('.social-media-placeholder-lower')
const vid = document.getElementById("bg")
const pause_button = document.getElementById("vidpause")
const scroll_form_buttons = document.querySelectorAll('.button-scroll-navigation')

const accordion_buttons = document.querySelectorAll('.accordion-button')
const accordion_sections = document.querySelectorAll('.accordion-section')

// Don't play the video if the user has indicated they prefer reduced motion
if (window.matchMedia('(prefers-reduced-motion)').matches) {
    vid.removeAttribute("autoplay");
    vid.pause();
    pause_button.innerHTML = "Paused";
}

// do some very simple lazyloading of the video 
document.addEventListener('DOMContentLoaded', () => {
  let source = document.getElementById('source')
  let source_src = source.dataset.src
  source.src = source_src

  vid.autoplay = true
  vid.load()
})

// Animation for the mobile navigation menu
toggler.addEventListener('click', (e)=>{
  e.preventDefault()
  toggler.classList.toggle('close')
  social_navigation.classList.add('animated')
  main_navigation.classList.add('animated')
  
  main_navigation.classList.toggle('show')
  social_navigation.classList.toggle('show')
  
  if (toggler.getAttribute('aria-expanded') == 'true') {
    toggler.setAttribute('aria-expanded', 'false')
  } else {
    toggler.setAttribute('aria-expanded', 'true')    
  }

})

// general function for resizing the window, throttled to improve performance

let resize_fn = throttle(()=> {
 
  if (window.matchMedia(`(min-width: ${bp_md}px)`).matches) {
    
    // large screens
    social_navigation.classList.remove('animated')
    toggler.classList.remove('close')
    main_navigation.classList.remove('animated')
    
      // if the mobile nav is 'open', let's close it if you end up dragging the window to be larger than the medium breakpoint. It seems strange to keep the nav open if you go from small > large > small again. 
    
    if(social_navigation.classList.contains('show') || main_navigation.classList.contains('show')) {
      social_navigation.classList.remove('show')
      main_navigation.classList.remove('show')
    }  

    // open accordions
    accordion_buttons.forEach((e) => {
      e.setAttribute('aria-expanded', true)
      e.tabIndex = -1
    })
    accordion_sections.forEach((e)=>{
      e.classList.add('open')
    })
    
  }
  
  // move the social media stuff to the main nav for correct tab ordering reasons
  if (window.matchMedia(`(max-width: ${bp_md}px)`).matches) {
    // small screens
    
    social_placeholder_lower.appendChild(social_navigation)

    // collapse accordions
    accordion_buttons.forEach((e) => {
      e.setAttribute('aria-expanded', false)
      e.tabIndex = 0
    })
    accordion_sections.forEach((e)=>{
      e.classList.remove('open')
    })
    
    // prevent tabbing to searchbox when it's invisible
    searchbox.tabIndex = -1
  } else {
    social_placeholder_upper.appendChild(social_navigation)
    searchbox.tabIndex = 0
  }
}, 200)

window.addEventListener('resize', resize_fn);
resize_fn()

// search function, lightly debounced for performance 
let search_fn = debounce((e)=>{
  
  // don't need to search if you haven't typed anything
  if (searchbox.value.length > 1) {
    let output = ''

    // this is where the main work gets done. I've stored all the keywords in an external file, data.js, as an array. So it converts the array to a string and searches for what you typed, and lowercases both so whatever is typed should match regardless of case
    
    const results = data.filter((el) => {
      return el.keywords.toString().toLowerCase().includes(searchbox.value.toString().toLowerCase())
    })

    // if there are matches, format them as a link and put them in the search results. Display some text/links above/below the results.

    const pluralize = results.length === 1 ? 'result' : 'results'
    output += `<div class="results-info">Found ${results.length} ${pluralize}</div>`
    results.forEach((item)=>{
      output += `<a href='${item.url}' target="_blank">${item.title}</a>`
    })
    output += `<a href="https://www.umbc.edu/stats/searchthru/?q=${searchbox.value}" class="external-search" target="_blank">Search for "${searchbox.value}" on UMBC.com</a>`
    search_results.innerHTML = output      
    
    output = ''
    
    if(e.which==40) {
      // down key pressed, focus on the first result
      e.preventDefault()
      search_results.querySelector('#search-results a').focus({preventScroll:true})
      return false
    }
    
    if (e.which==27) {
      // esc key, close the search results window
      e.preventDefault()
      search_results.innerHTML = output      
    }

  } else {
    search_results.innerHTML = ''
  }
}, 50)

searchbox.addEventListener("keydown", search_fn)

// the search button hides/shows the search field, but it's only visible on mobile sizes
search_button.addEventListener("click", (e)=>{
  e.preventDefault()
  
  if (window.matchMedia(`(max-width: ${bp_md}px)`).matches) {
    search_wrapper.classList.toggle('show')
  }
  
  if (searchbox.tabIndex == 0) {
    searchbox.tabIndex = -1  
  } else {
    searchbox.tabIndex = 0  
    searchbox.focus({preventScroll:true})
    return false
  }
  
  if (search_button.getAttribute('aria-expanded') == 'true') {
    search_button.setAttribute('aria-expanded', 'false')
  } else {
    search_button.setAttribute('aria-expanded', 'true')    
  }
})

// Keep track of keypresses when you're focused on the search results
search_results.addEventListener("keydown", (e)=>{
  if(e.which==40) {
    // down key pressed and you're on the search results, get the next one
    e.preventDefault()
    let curr = document.activeElement
    let next = curr.nextElementSibling
        
    if (next !== null) {
      next.focus({preventScroll:true})      
      return false
    }
  }
  if(e.which==38) {
    // up key pressed and you're on the search results, get the prev one
    e.preventDefault()
    let curr = document.activeElement
    let prev = curr.previousElementSibling
    
    if (!prev.classList.contains('results-info')) {
      prev.focus({preventScroll:true})      
      return false
    } else {
      // at the top, go back to the search box
      searchbox.focus({preventScroll:true})
    } 
  }
  
  if (e.which==27) {
    // esc key, back out of the search results list
    e.preventDefault()
    searchbox.focus()
  }
})

// this is the form in the yellow box that lets you scroll between "pages" on mobile screens

scroll_form_buttons.forEach(((button)=>{
  button.addEventListener("click", (e)=>{
    e.preventDefault()
    let target =  e.target.getAttribute('data-target')

    document.querySelector('.scroll-form-wrapper').scrollTo({left: (document.getElementById(target).offsetLeft - 20), behavior: 'smooth'})  
    return false
  })
}))

document.querySelectorAll('.scroll-form-form #page-2 input, .scroll-form-form #page-2 button').forEach((input)=>{
  input.addEventListener("focus", ()=>{
    document.querySelector('.scroll-form-wrapper').scrollTo({left: (document.getElementById('page-2').offsetLeft - 20), behavior: 'smooth'})  
  })
})

document.querySelectorAll('.scroll-form-form #page-1 input, .scroll-form-form #page-1 button').forEach((input)=>{
  input.addEventListener("focus", ()=>{
    document.querySelector('.scroll-form-wrapper').scrollTo({left: (document.getElementById('page-1').offsetLeft - 20), behavior: 'smooth'})  
  })
})

accordion_buttons.forEach(button => {
  button.addEventListener('click', (e) => {

    let section = document.getElementById(e.target.getAttribute('aria-controls'))
    
    button.classList.toggle('expanded');
    section.classList.toggle('open');
    
    if (button.classList.contains('expanded')) {
      button.setAttribute('aria-expanded', true);
      section.setAttribute('aria-hidden', false);
    } else {
      button.setAttribute('aria-expanded', false);
      section.setAttribute('aria-hidden', true);
    }
  })
})

pause_button.addEventListener("click", ()=> {
  if (vid.paused) {
    vid.play();
    pause_button.innerHTML = "<img src='assets/images/icon-pause.svg' alt='click to pause video'>";
  } else {
    vid.pause();
    pause_button.innerHTML = "<img src='assets/images/icon-play.svg' alt='click to play video'>";
  }
})

// event listener for clicks on the whole document
document.body.addEventListener('click', (e)=>{
  
  // Useful for knowing when to close the search results
  if (search_results.childNodes.length > 0 && e.target.id !== 'search') {
    search_results.innerHTML = ''
  }
  
  // This lets you know where users are clicking. An attempt at rudimentary analytics tracking in lieu of something like google analytics
  
  const data = {
    x: e.pageX,
    y: e.pageY,
    location: document.location.pathname,
    target: e.target,
    // text: e.target.innerHTML
  }

  fetch('https://httpbin.org/post', {
    method: 'POST', 
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  .then(response => response.json())
  .then(data => {
    console.log('Success:', data);
  })
  .catch((error) => {
    console.error('Error:', error);
  });
  
  console.log(data)  

})

