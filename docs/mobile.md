# Mobile platforms: Android + iPhone

**The main development device is Android.** The iPhone is for periodic checks: at key steps and whenever the layout changes.

Important: on iPhone **all browsers run on the Safari engine (WebKit)**, so checking in Safari also covers Chrome on iPhone.

## How to test

| | Android | iPhone |
|---|---|---|
| Access to the dev build | Cloudflare Quick Tunnel (HTTPS), see [poc.md](poc.md#phone-access-through-a-tunnel) | The same link, opened in Safari |
| Debugging | Chrome DevTools over USB: on the phone enable "Developer options" → "USB debugging", on the PC open `chrome://inspect` | Full Safari debugging requires a Mac. From Windows — an on-page console: the **Eruda** library, included only in the dev build (e.g. behind a `?debug` parameter) |
| PWA installation | An "Install" button (our own, via the `beforeinstallprompt` event) | Manual: Safari → "Share" → "Add to Home Screen" |

## iPhone specifics we account for from the start

| What | Problem | What we do |
|---|---|---|
| Installation | No `beforeinstallprompt`, so no "Install" button | Our own hint with instructions — shown on iPhone when the app isn't installed yet (`display-mode: standalone`) |
| Icon | iOS uses `apple-touch-icon` | Add a 180×180 `apple-touch-icon` besides the manifest icons; for Android — also a maskable icon |
| Notch / Dynamic Island, home indicator | Content hides under them | `viewport-fit=cover` + `env(safe-area-inset-*)` paddings |
| Screen height | `100vh` on iPhone ignores the browser bars | Use `100dvh` |
| Input fields | Safari zooms in when a field's font is < 16 px | Input font ≥ 16 px |
| Photos | iPhone shoots in HEIC | Check which format the file arrives in from `<input capture>`; the backend accepts only JPEG / PNG / WebP |
| Memory | Phones limit a tab's memory, and a heavy WASM model (background removal) can kill the tab outright | Checked on real phones in step 11. A coarse pointer gets the smaller `isnet_quint8`, which an iPhone and Android Chrome hold. A browser whose tab dies mid-cut-out anyway (Samsung Internet) is remembered in `localStorage`, saves originals with a note, and offers to try again (`fit-cutout-to-phones`). Next fallback: remove backgrounds on the server |
| Browser storage | Safari may clear a site's local data | Anything important lives only on the server; locally only a speed cache (already so by architecture) |
| Sign-in after install | A home screen PWA has storage and cookies separate from Safari | After installing you have to sign in again — that's normal, worth hinting in the UI |
| Push notifications | Only for an installed PWA (iOS 16.4+), permission only after a user action | An "Enable notifications" button, not a prompt on open |
| Background jobs | No Background Sync on iPhone | Don't rely on it: retry unfinished uploads on the next open |
| Vibration, Fullscreen API | Unavailable on iPhone | Don't use them for important features |

## iPhone testing checklist

Run at steps 9 and 11 ([roadmap.md](roadmap.md)) and after noticeable layout changes:

- [ ] pages don't hide under the notch and the home indicator
- [ ] input fields don't zoom the page
- [ ] photos from the camera and the gallery upload with the correct orientation
- [ ] background removal works and doesn't crash
- [ ] the app is added to the home screen with the right icon and opens without Safari bars
- [ ] after installing you can sign in and stay signed in
