// ==UserScript==
// @name YouTube Music Lyrics V2.0 by ProComGameS
// @namespace Better Lyrics
// @match https://music.youtube.com/*
// @connect https://apic-desktop.musixmatch.com/*
// @noframes
// @grant GM_xmlhttpRequest
// @grant GM_getValue
// @grant GM_setValue
// ==/UserScript==


//////////////////////////////////////////////////////////////
/////  COMPAT  ///////////////////////////////////////////////
//////////////////////////////////////////////////////////////

if (GM_xmlhttpRequest === undefined)
  GM_xmlhttpRequest = GM.xmlHttpRequest
if (GM_getValue === undefined)
  GM_getValue = GM.getValue
if (GM_setValue === undefined)
  GM_setValue = GM.setValue

if (window.trustedTypes && window.trustedTypes.createPolicy) {
  window.trustedTypes.createPolicy('default', {
    createHTML: (string, sink) => string
  });
}

//////////////////////////////////////////////////////////////
/////  STYLE  ////////////////////////////////////////////////
//////////////////////////////////////////////////////////////

const style = document.createElement('style');


    list-style-type: none;
}
ul.lyrics-list li.other {
    opacity: 0.4;
}
@keyframes fadeIn {

    animation-name: fadeIn;
    animation-fill-mode: both;
    animation-duration: 0.3s;
    margin: 0em;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0);
}

    position: absolute;
    margin: 2em;
    pointer-events: none;
}

`

document.head.appendChild(style);


//////////////////////////////////////////////////////////////
/////  FETCH AND CACHE LYRICS  ///////////////////////////////
//////////////////////////////////////////////////////////////

function fetchLyrics(track, artists) {
  return new Promise((resolve, reject) => {
    const artistsStr = artists.map(artist => `&q_artist=${encodeURIComponent(artist.replace(/\//g, ''))}`).join('')

    const url = `https://apic-desktop.musixmatch.com/ws/1.1/macro.subtitles.get`
              + `?format=json&user_language=en&namespace=lyrics_synched`
              + `&f_subtitle_length_max_deviation=1&subtitle_format=mxm`
              + `&app_id=web-desktop-app-v1.0&usertoken=201219dbdb0f6aaba1c774bd931d0e79a28024e28db027ae72955c`
              + `&q_track=${encodeURIComponent(track)}${artistsStr}`

    GM_xmlhttpRequest({
      url,
      method: 'GET',

      headers: {
        Cookie: 'AWSELB=55578B011601B1EF8BC274C33F9043CA947F99DCFF0A80541772015CA2B39C35C0F9E1C932D31725A7310BCAEB0C37431E024E2B45320B7F2C84490C2C97351FDE34690157',
        Origin: 'musixmatch.com',
      },

      onabort: reject,
      onerror: reject,

onloadend: res => {
        const { message: { body: { macro_calls } } } = JSON.parse(res.responseText)

        if ('track.subtitles.get' in macro_calls &&
            macro_calls['track.subtitles.get']['message']['body'] &&
            macro_calls['track.subtitles.get']['message']['body']['subtitle_list'] &&
            macro_calls['track.subtitles.get']['message']['body']['subtitle_list'].length > 0) {
          const subs = macro_calls['track.subtitles.get']['message']['body']['subtitle_list'][0].subtitle.subtitle_body

          return resolve(JSON.parse(subs))
        } else if ('matcher.track.get' in macro_calls &&
                   macro_calls['matcher.track.get']['message']['body']) {
          const info = macro_calls['matcher.track.get']['message']['body']['track']

          if (info.instrumental)
            return reject('Instrumental track.')
        }

        reject('Track not found.')
      },
    })
  })
}


//////////////////////////////////////////////////////////////
/////  HELPERS  //////////////////////////////////////////////
//////////////////////////////////////////////////////////////

function centerElementInContainer(element, container) {
  if (element == null)
    return

  const scrollTo = element.offsetTop - container.offsetHeight / 2 + element.offsetHeight / 2

  container.scrollTo(0, scrollTo)
}

function html(strings, ...args) {
  const template = document.createElement('template')

  template.innerHTML = String.raw(strings, ...args).trim()

  return template.content.firstChild
}


//////////////////////////////////////////////////////////////
/////  MAIN LOOP  ////////////////////////////////////////////
//////////////////////////////////////////////////////////////

function setup() {
  const STEP = 100

  // Set up out own elements
  const containerEl = document.body,
        controlsEl  = document.querySelector('.right-controls-buttons.ytmusic-player-bar')
  const origLyricsEl = document.querySelector('#side-panel ytmusic-tab-renderer').querySelector("ytmusic-section-list-renderer")

  const controlEl = html`
    <tp-yt-paper-icon-button class="toggle-lyrics style-scope ytmusic-player-bar" icon="yt-icons:subtitles" title="Toggle lyrics" aria-label="Toggle lyrics" role="button">`

  const wrapperEl = html`
    <div class="lyrics-wrapper hidden">
      <div class="lyrics-container">
        <p class="lyrics-delay"></p>
        <ul class="lyrics-list">`

  origLyricsEl.insertBefore(wrapperEl, origLyricsEl.firstElementChild)


  const lyricsEl = origLyricsEl.querySelector('ul.lyrics-list'),
        delayEl = origLyricsEl.querySelector('p.lyrics-delay')

  controlEl.addEventListener('click', () => {
    wrapperEl.classList.toggle('hidden')

    centerElementInContainer(wrapperEl.querySelector('.active'), wrapperEl.firstElementChild)
  })

  let lyrics = [],
      activeLyric = undefined,
      autoScroll = true

  function setError(message) {
    controlEl.title = message
    controlEl.disabled = true

    wrapperEl.classList.remove('fullscreen')

    controlEl.classList.add('error')
    wrapperEl.classList.add('hidden')
  }

  function clearError() {
    controlEl.title = 'Toggle lyrics'
    controlEl.disabled = false

    controlEl.classList.remove('error')
  }

  async function onSongChanged(track, artists, time) {
    clearError()
    lyricsEl.innerHTML = ''
    wrapperEl.firstElementChild.scrollTo(0, 0)

    try {
      const cacheKey = `${track} -- ${artists}`,
            cached = GM_getValue(cacheKey)

      if (cached === undefined)
        GM_setValue(cacheKey, JSON.stringify(lyrics = await fetchLyrics(track, artists)))
      else
        lyrics = JSON.parse(cached)

      for (let i = 0; i < 8; i++) {
        lyricsEl.appendChild(document.createElement('br'))
      }

      for (const lyric of lyrics) {
        const el = document.createElement('li'),
              text = lyric.text || (lyric === lyrics[lyrics.length - 1] ? '♪' : '♪')

        if (text === '')
          el.classList.add('other')

        el.setAttribute('data-time', lyric.time.total)
        el.setAttribute('data-text', lyric.text)

        const a = document.createElement('a');
        a.href = '#';
        a.innerText = text
        a.style.textDecoration = 'none';
        a.style.color = 'inherit';
        el.appendChild(a);

        a. addEventListener('click', function(event) {
          event.preventDefault();
          moveLyric(lyric.time.total);
        });

        lyric.element = el
        lyricsEl.appendChild(el)

      }

      for (let i = 0; i < 8; i++) {
        lyricsEl.appendChild(document.createElement('br'))
      }

      lyrics.reverse()
      onTimeChanged(time)
    } catch (err) {
      setError(err)
    }
  }

  function moveLyric(time) {
    const myDiv = document.getElementById('movie_player');
    const functionName = 'seekTo';
    if (myDiv && myDiv[functionName] && typeof myDiv[functionName] === 'function') {
      myDiv[functionName](time); // 함수 호출
    } else {
      console.error('Function not found or not a valid function');
    }
    onTimeChanged(time)
  }

  function onTimeChanged(time) {
    const newActiveLyric = lyrics.find(x => x.time.total <= time)

    if (activeLyric !== undefined) {
      if (activeLyric === newActiveLyric)
        return

      activeLyric.element.classList.remove('active')
    }

    if ((activeLyric = newActiveLyric) !== undefined) {
      activeLyric.element.classList.add('active')

      if (autoScroll) {
        centerElementInContainer(activeLyric.element, wrapperEl.firstElementChild)
        activeLyric.element.scrollIntoView({
            behavior: 'smooth',
            block: 'center',
            inline: 'center'
        });
      }
    } else {
      wrapperEl.firstElementChild.scrollTo(0, 0)
    }
  }


  let currentSong = '',
      currentArtists = '',
      currentTime = 0,
      currentS = 0,
      loadingCount = 0,
      delayMs = 0

  const progressEl = document.querySelector('.time-info')

  setInterval(() => {
    const trackNameEl = document.querySelector('.content-info-wrapper .title'),
          trackArtistsEls = [...document.querySelectorAll('.content-info-wrapper .subtitle a')]
                              .filter(x => x.pathname.startsWith('/channel/UC')
                                        || x.pathname.startsWith('/browse/FEmusic_library_privately_owned_artist_detail'))

    if (trackArtistsEls.length === 0) {
      const alt = document.querySelector('.content-info-wrapper .subtitle span')

      if (alt !== null)
        trackArtistsEls.push(alt)
    }

    const myDiv = document.getElementById('movie_player');
    const functionName = 'getCurrentTime';
    let time
    if (myDiv && myDiv[functionName] && typeof myDiv[functionName] === 'function') {
      time = myDiv[functionName](); // 함수 호출
    } else {
      console.error('Function not found or not a valid function');
    }
    const video = document.querySelector('video');
    const song = trackNameEl.textContent,
          artists = trackArtistsEls.map(x => x.textContent).filter(x => x.length > 0);

    if (song !== currentSong || artists.length !== currentArtists.length || artists.some((a, i) => currentArtists[i] !== a)) {
      if (song.length === 0 || artists.length === 0) {
        if (loadingCount < 10) {
          loadingCount++
          return
        }
      }

      onSongChanged(currentSong = song, currentArtists = artists, currentTime = time)
      loadingCount = delayMs = 0
    } else {
      // Interpolate milliseconds, this makes things MUCH smoother
      if (currentTime !== time)
        currentS = 0
      else
        currentS = Math.min(.95, currentS + STEP / 1000)

      onTimeChanged((currentTime = time) + currentS + delayMs / 1000)
    }
  }, STEP)

  let delayTimeout

  document.addEventListener('keydown', e => {
    if (e.target.tagName === 'INPUT')
      return

    if (e.keyCode === 88 /* X */) {
      if (delayTimeout) {
        clearTimeout(delayTimeout)
        delayTimeout = undefined
      }

      if (e.altKey)
        delayMs = 0
      else if (e.shiftKey)
        delayMs -= 100
      else
        delayMs += 100

      delayEl.innerText = `Delay: ${delayMs / 1000}s`
      delayTimeout = setTimeout(() => delayEl.innerText = '', 1000)
    }
    else if (e.keyCode === 90 /* Z */) {
      autoScroll = !autoScroll

      delayEl.innerText = `Autoscroll ${autoScroll ? 'enabled' : 'disabled'}`
      delayTimeout = setTimeout(() => delayEl.innerText = '', 1000)
    }
    else if (e.keyCode === 27 /* Escape */) {
      wrapperEl.classList.remove('fullscreen')
    }
  })
}

let checkInterval = setInterval(() => {
  if (document.querySelector('#side-panel ytmusic-tab-renderer').querySelector("ytmusic-section-list-renderer") !== null && document.querySelector('#side-panel ytmusic-tab-renderer').querySelector("ytmusic-section-list-renderer").querySelector('ul.lyrics-list') === null)
    clearInterval(checkInterval)
    setup()
    return
}, 100)
