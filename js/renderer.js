export class CanvasRenderer {
  constructor(ctx, color, lineWidth){
    this._ctx = ctx; this.color = color; this.lw = lineWidth;
  }
  begin(){ this._ctx.beginPath(); }
  moveTo(x,y){ this._ctx.moveTo(x,y); }
  lineTo(x,y){ this._ctx.lineTo(x,y); }
  close(){ this._ctx.closePath(); }
  stroke(){
    this._ctx.lineWidth = this.lw;
    this._ctx.strokeStyle = this.color;
    this._ctx.lineCap = 'round';
    this._ctx.lineJoin = 'round';
    this._ctx.stroke();
  }
  ellipse(cx,cy,rx,ry){
    this._ctx.beginPath();
    this._ctx.ellipse(cx,cy,rx,ry,0,0,Math.PI*2);
    this._ctx.lineWidth = this.lw;
    this._ctx.strokeStyle = this.color;
    this._ctx.stroke();
  }
  rect(x,y,w,h,r=0){
    this._ctx.beginPath();
    if (this._ctx.roundRect) this._ctx.roundRect(x,y,w,h,r);
    else this._ctx.rect(x,y,w,h);
    this._ctx.lineWidth = this.lw;
    this._ctx.strokeStyle = this.color;
    this._ctx.stroke();
  }
  path(points, closed=false){
    this._ctx.beginPath();
    points.forEach(([x,y],i)=> i ? this._ctx.lineTo(x,y) : this._ctx.moveTo(x,y));
    if (closed) this._ctx.closePath();
    this._ctx.lineWidth = this.lw;
    this._ctx.strokeStyle = this.color;
    this._ctx.lineCap = 'round';
    this._ctx.lineJoin = 'round';
    this._ctx.stroke();
  }
}

export const SVGRenderer = {
  create(w, h){
    const svg = document.createElementNS('http://www.w3.org/2000/svg','svg');
    svg.setAttribute('xmlns','http://www.w3.org/2000/svg');
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    return svg;
  },
  serialize(svg){ return new XMLSerializer().serializeToString(svg); },
  Renderer: class {
    constructor(svg, color, lw){ this.svg = svg; this.color = color; this.lw = lw; this._d = ''; }
    _flush(){
      if (!this._d) return;
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d', this._d);
      p.setAttribute('fill','none');
      p.setAttribute('stroke', this.color);
      p.setAttribute('stroke-width', this.lw);
      p.setAttribute('stroke-linecap','round');
      p.setAttribute('stroke-linejoin','round');
      this.svg.appendChild(p);
      this._d = '';
    }
    begin(){ this._d = ''; }
    moveTo(x,y){ this._d += `M ${x} ${y} `; }
    lineTo(x,y){ this._d += `L ${x} ${y} `; }
    close(){ this._d += 'Z '; }
    stroke(){ this._flush(); }
    ellipse(cx,cy,rx,ry){
      const e = document.createElementNS('http://www.w3.org/2000/svg','ellipse');
      e.setAttribute('cx',cx); e.setAttribute('cy',cy);
      e.setAttribute('rx',rx); e.setAttribute('ry',ry);
      e.setAttribute('fill','none'); e.setAttribute('stroke',this.color);
      e.setAttribute('stroke-width', this.lw);
      this.svg.appendChild(e);
    }
    rect(x,y,w,h,r=0){
      const rc = document.createElementNS('http://www.w3.org/2000/svg','rect');
      rc.setAttribute('x',x); rc.setAttribute('y',y);
      rc.setAttribute('width',w); rc.setAttribute('height',h);
      if (r) { rc.setAttribute('rx',r); rc.setAttribute('ry',r); }
      rc.setAttribute('fill','none'); rc.setAttribute('stroke',this.color);
      rc.setAttribute('stroke-width', this.lw);
      this.svg.appendChild(rc);
    }
    path(points, closed=false){
      this.begin();
      points.forEach(([x,y],i)=> i ? this.lineTo(x,y) : this.moveTo(x,y));
      if (closed) this.close();
      this.stroke();
    }
  }
};
