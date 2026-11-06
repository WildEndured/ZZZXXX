* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: system-ui, sans-serif; background: #1a1a1a; color: #ddd; }

#app {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

#canvas {
  flex: 1;
  height: 100vh;
  width: auto;
  background: #fff;
  object-fit: contain;
  display: block;
  max-width: calc(100vw - 320px);
}

#panel {
  width: 320px;
  padding: 16px;
  background: #252525;
  overflow-y: auto;
  border-left: 1px solid #333;
}

h2 { font-size: 16px; margin-bottom: 12px; color: #fff; }

label {
  display: block;
  font-size: 12px;
  margin-bottom: 10px;
  color: #aaa;
}

label span {
  float: right;
  color: #4fc3f7;
  font-weight: 600;
}

input[type="range"] {
  width: 100%;
  margin-top: 4px;
  accent-color: #4fc3f7;
}

select {
  width: 100%;
  margin-top: 4px;
  padding: 4px;
  background: #333;
  color: #ddd;
  border: 1px solid #444;
  border-radius: 4px;
}

fieldset {
  border: 1px solid #333;
  border-radius: 6px;
  padding: 10px;
  margin-bottom: 12px;
}

legend {
  font-size: 12px;
  color: #4fc3f7;
  padding: 0 6px;
}

button {
  width: 100%;
  padding: 10px;
  background: #4fc3f7;
  color: #111;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 8px;
}

button:hover { background: #29b6f6; }
