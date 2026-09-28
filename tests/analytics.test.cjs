const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const code=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function harness(){
  const nodes=new Map([...html.matchAll(/id="([^"]+)"/g)].map(m=>[m[1],{textContent:'',className:''}]));
  const context=vm.createContext({document:{querySelectorAll:()=>[],getElementById:id=>{assert.ok(nodes.has(id),id);return nodes.get(id);}},navigator:{},setInterval:()=>{},fetch:async()=>{throw Error('offline');},Date,console});
  vm.runInContext(code.replace('loadLiveData();',''),context);
  return {context,nodes,run:expression=>vm.runInContext(expression,context)};
}
const base={visitors:27,visits:27,pageviews:45,bounceRate:8/9,visitDurationSeconds:1304.5185,viewsPerVisit:45/27,conversionRate:null};
test('formats Clics fractions, duration and missing conversion',()=>{
  const h=harness(); h.context.data={website:base,sourceStatus:{clics:'connected'}};
  h.run('renderTraffic(data)');
  assert.match(h.nodes.get('traffic-bounceRate').textContent,/88,9/);
  assert.equal(h.nodes.get('traffic-visitDurationSeconds').textContent,'21 min 45 s');
  assert.equal(h.nodes.get('traffic-conversionRate').textContent,'—');
  assert.equal(h.nodes.get('kpiVisitors').textContent,'27');
  assert.equal(h.nodes.get('clicsState').textContent,'Tracking partiellement validé');
});
test('missing metrics remain unavailable and real zeros remain zero',()=>{
  const h=harness();
  assert.equal(h.run('formatNumber(null)'),'—');
  assert.equal(h.run('formatNumber(undefined)'),'—');
  assert.equal(h.run('formatNumber(0)'),'0');
  assert.equal(h.run('formatNumber("")'),'—');
  assert.equal(h.run('assessTracking({}, "connected").values.visitors'),null);
  assert.equal(h.run('assessTracking({visitors:0,visits:0,pageviews:0}, "connected").partial'),true);
});
test('inconsistencies never hide positive traffic',()=>{
  const h=harness();h.context.w={...base,visits:0};
  assert.equal(h.run('assessTracking(w,"tracking_issue").values.visitors'),27);
  assert.match(h.run('assessTracking(w,"connected").message'),/incohérentes/);
  h.context.w={...base,bounceRate:88.9,viewsPerVisit:8};
  assert.equal(h.run('assessTracking(w,"connected").values.bounceRate'),null);
  assert.match(h.run('assessTracking(w,"connected").message'),/Pages par visite/);
});
test('refresh resets status and period in both directions',()=>{
  const h=harness();h.context.data={website:{...base,period:'last7days'},sourceStatus:{clics:'tracking_issue'}};
  h.run('renderTraffic(data)');
  h.context.data={website:{...base,conversionRate:0,period:'last30days'},sourceStatus:{clics:'connected'}};
  h.run('renderTraffic(data)');
  assert.equal(h.nodes.get('clicsState').textContent,'Mesures Clics cohérentes');
  assert.equal(h.nodes.get('kpiVisitorsSub').textContent,'30 derniers jours');
  assert.match(h.nodes.get('homeConversion').textContent,/0/);
  h.context.data={website:{},sourceStatus:{clics:'connected'}};
  h.run('renderTraffic(data)');
  assert.equal(h.nodes.get('kpiVisitors').textContent,'—');
  assert.equal(h.nodes.get('clicsState').textContent,'Tracking partiellement validé');
});
