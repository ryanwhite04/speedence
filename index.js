import { Port, rough, LitElement, html, css } from './modules.bundle.js';
'serviceWorker' in navigator && window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js'));
class TripRecorder extends LitElement {
  static get properties() {
    return {
      connected: { type: Boolean },
      ticks: { type: Array },
      size: { type: Number },
    }
  }
  constructor() {
    super();
    this.connected = false;
    this.ticks = [];
    this.size = 26;
    this.width = this.height = 192;
  }
  async request() {
    return new Port(await navigator.usb.requestDevice({ filters: [
      { vendorId: 0x239A }, // Adafruit boards
      { vendorId: 0xcafe }, // TinyUSB example
    ] }));
  }
  connectedCallback() {
    super.connectedCallback();
    console.log('Starting', event);
    navigator.usb.getDevices()
      .then(devices => devices.map(device => new Port(device)))
      .then(ports => {
        if (ports.length) {
          this.port = ports[0];
        } else console.log("no ports");
      });
  }
  connect(port) {
    console.log("Connecting to Port: ", port, this);
    let receive = this.receive;
    port.connect().then(() => {
      console.log("Connected to port: ", port)
      port.onReceive = this.receive(this);
      port.onReceiveError = console.error;
    }, console.error);
  }
  disconnect(port) {
    console.log("Disconnecting from Port: ", port);
    port.disconnect();
  }
  receive(element) {
    return data => {
      let textDecoder = new TextDecoder();
      let received = parseInt(textDecoder.decode(data));
      if (!isNaN(received)) {
        element.ticks.unshift(Date.now());
        element.requestUpdate();
      }
      return received
    }
  }
  toggle() {
    if (this.connected) {
      this.disconnect(this.port)
    } else {
      this.request()
      .then(selected => (this.port = selected))
      .then(() => this.connect(this.port))
      .catch(console.error);
    }
  }
  firstUpdated() {
    // this.drawWheelCanvas(this.shadowRoot.getElementById('canvas'), this.width, this.height);
    this.drawWheelSVG(this.shadowRoot.getElementById('svg'), this.width, this.height);
  }
  drawWheelCanvas(canvas, w, h) {
    this.rc = rough.canvas(canvas);
    this.rc.rectangle(w/8, h/8, 6*w/8, 6*h/8);
    this.rc.ellipse(w/2, h/2, 5*w/8, 5*h/8, {
      fill: "rgb(16, 16, 16)",
      fillWeight: 2,
    }); // centerX, centerY, diameter
    this.rc.ellipse(w/2, h/2, w/2, h/2, {
      fill: "rgb(255, 255, 255)",
      fillStyle: 'solid',
    }); // centerX, centerY, diameter
    for (let i = 0; i < 16; i++) {
      this.rc.line(w/2, h/2, w/2 + w/4*Math.cos(i*Math.PI/8), h/2 + h/4*Math.sin(i*Math.PI/8)); // x1, y1, x2, y2     
    }
  }
  drawWheelSVG(svg, w, h) {
    let rs = rough.svg(svg);
    svg.appendChild(rs.rectangle(w/8, h/8, 6*w/8, 6*h/8));
    svg.appendChild(rs.ellipse(w/2, h/2, 5*w/8, 5*h/8, {
      fill: "rgb(16, 16, 16)",
      fillWeight: 2,
    })); // centerX, centerY, diameter
    svg.appendChild(rs.ellipse(w/2, h/2, w/2, h/2, {
      fill: "rgb(255, 255, 255)",
      fillStyle: 'solid',
    })); // centerX, centerY, diameter
    for (let i = 0; i < 16; i++) {
      svg.appendChild(rs.line(w/2, h/2, w/2 + w/4*Math.cos(i*Math.PI/8), h/2 + h/4*Math.sin(i*Math.PI/8))); // x1, y1, x2, y2     
    }
  }
  tick() {
    this.ticks.unshift(Date.now());
    this.requestUpdate();
  }
  get circumference() {
    return Math.PI*0.0254*this.size;
  }
  get distance() {
    return parseInt(this.circumference * this.ticks.length);
  }
  get time() {
    return this.ticks.length > 1 ?
      this.ticks[0] - this.ticks[1] :
      0;
  }
  get speed() {
    return this.time ? parseInt(3600 * this.circumference / this.time) : 0;
  }
  reset() {
    this.ticks = [];
  }
  static get styles() {
    return css`
      svg > g:not(:first-child) {
        animation-name: spin;
        animation-iteration-count: infinite;
        animation-timing-function: linear;
        animation-duration: var(--animationDuration);
        transform-origin: 50% 50%;
      }
      @keyframes spin {
        from { transform:rotate(0deg); }
        to { transform:rotate(360deg); }
      }
      label {
        display: block;
        font-size: larger;    
      }
      wired-slider {
        display: block;
        margin: auto;
      }
    `;
  }
  render() {
    return html`
      <style>
        svg {
          --animationDuration: ${this.time}ms;
          display: block;
          margin: auto;
        }
      </style>
      <wired-button @click=${this.reset}>Reset</wired-button>
      <wired-button @click=${this.tick}>Tick</wired-button>
      <wired-button @click=${this.toggle}>${this.connected ? "Disconnect" : "Connect"}</wired-button>
      <p>Distance Travelled: ${this.distance}m</p>
      <p>Current Speed: ${this.speed} km/h</p>
      <svg width=${this.width} height=${this.height} id="svg"></svg>
      <label for="size">Wheel Size
        <wired-slider id="size" step="0.5" knobradius="15" value=${this.size} @change=${this.updateSize} min="16" max="36"></wired-slider>
      </label>
      <p>Diameter: ${this.size} Inches</p>
      <p>Circumference: ${parseInt(100 * this.circumference)/100}m</p>
    `;
  }  
  updateSize(event) {
    console.log(event.detail.value);
    this.size = event.detail.value;
  }
}
customElements.define('trip-recorder', TripRecorder);