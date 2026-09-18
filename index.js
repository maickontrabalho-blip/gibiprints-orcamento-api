const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
const OVERPASS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter'
];

const CATEGORIES = {
  padaria:['shop=bakery','craft=bakery','amenity=cafe','shop=convenience'],
  padarias:['shop=bakery','craft=bakery','amenity=cafe','shop=convenience'],
  panificadora:['shop=bakery','craft=bakery'],
  panificadoras:['shop=bakery','craft=bakery'],
  confeitaria:['shop=bakery','craft=bakery'],
  confeitarias:['shop=bakery','craft=bakery'],
  cafeteria:['amenity=cafe'],
  cafeterias:['amenity=cafe'],
  cafe:['amenity=cafe'],
  cafes:['amenity=cafe'],
  restaurante:['amenity=restaurant'],
  restaurantes:['amenity=restaurant'],
  lanchonete:['amenity=fast_food'],
  lanchonetes:['amenity=fast_food'],
  hamburgueria:['amenity=fast_food'],
  hamburguerias:['amenity=fast_food'],
  pizzaria:['amenity=fast_food'],
  pizzarias:['amenity=fast_food'],
  barbearia:['shop=hairdresser'],
  barbearias:['shop=hairdresser'],
  cabeleireiro:['shop=hairdresser'],
  cabeleireiros:['shop=hairdresser'],
  salao:['shop=hairdresser'],
  saloes:['shop=hairdresser'],
  academia:['leisure=fitness_centre','leisure=sports_centre'],
  academias:['leisure=fitness_centre','leisure=sports_centre'],
  farmacia:['amenity=pharmacy'],
  farmacias:['amenity=pharmacy'],
  mercado:['shop=supermarket','shop=convenience'],
  mercados:['shop=supermarket','shop=convenience'],
  supermercado:['shop=supermarket'],
  supermercados:['shop=supermarket'],
  petshop:['shop=pet'],
  petshops:['shop=pet'],
  otica:['shop=optician'],
  oticas:['shop=optician'],
  floricultura:['shop=florist'],
  floriculturas:['shop=florist'],
  roupas:['shop=clothes'],
  lojaderoupas:['shop=clothes'],
  lojasderoupa:['shop=clothes']
};

function json(res,status,payload){
  res.status(status).setHeader('Content-Type','application/json; charset=utf-8').setHeader('Cache-Control','no-store');
  return res.end(JSON.stringify(payload));
}
function norm(v=''){return String(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'').trim();}
function regex(v=''){return String(v).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}
function tagsFor(term){
  const n=norm(term);
  return CATEGORIES[n] || CATEGORIES[n.endsWith('s')?n.slice(0,-1):n] || [];
}

async function geocode(q){
  const u=new URL(NOMINATIM);
  u.searchParams.set('format','jsonv2');u.searchParams.set('limit','1');u.searchParams.set('countrycodes','br');u.searchParams.set('q',q);
  const r=await fetch(u,{headers:{Accept:'application/json','User-Agent':'BuscaCerta/2.0'}});
  if(!r.ok)throw new Error(`Falha ao localizar a região (HTTP ${r.status}).`);
  const d=await r.json();
  if(!d.length)throw new Error('Localização não encontrada. Tente outro bairro ou cidade.');
  return {lat:+d[0].lat,lon:+d[0].lon,display:d[0].display_name};
}

function buildQuery(lat,lon,radius,term,broad=false){
  const tags=tagsFor(term), clauses=[];
  for(const tag of tags){
    const [k,v]=tag.split('=');
    clauses.push(`nwr["${k}"="${v}"](around:${radius},${lat},${lon});`);
  }
  const words=String(term).trim().split(/\s+/).filter(Boolean).map(regex).filter(x=>x.length>1);
  if(words.length){
    const rx=words.join('|');
    clauses.push(`nwr["name"~"${rx}",i](around:${radius},${lat},${lon});`);
    clauses.push(`nwr["brand"~"${rx}",i](around:${radius},${lat},${lon});`);
    clauses.push(`nwr["operator"~"${rx}",i](around:${radius},${lat},${lon});`);
    clauses.push(`nwr["description"~"${rx}",i](around:${radius},${lat},${lon});`);
  }
  if(broad){
    // Broad fallback used only when the category query returns too little.
    clauses.push(`nwr["shop"](around:${radius},${lat},${lon});`);
    clauses.push(`nwr["amenity"](around:${radius},${lat},${lon});`);
    clauses.push(`nwr["craft"](around:${radius},${lat},${lon});`);
    clauses.push(`nwr["leisure"](around:${radius},${lat},${lon});`);
  }
  return `[out:json][timeout:90];(${clauses.join('')});out center tags;`;
}

async function overpass(q){
  let last='';
  for(const endpoint of OVERPASS){
    try{
      const r=await fetch(endpoint,{
        method:'POST',
        headers:{'Content-Type':'application/x-www-form-urlencoded; charset=UTF-8','User-Agent':'BuscaCerta/2.0'},
        body:'data='+encodeURIComponent(q)
      });
      if(!r.ok)throw new Error(`HTTP ${r.status}`);
      return await r.json();
    }catch(e){last=e.message;}
  }
  throw new Error('Os servidores públicos de mapas não responderam. Tente novamente. '+last);
}

function cleanUrl(v=''){
  if(!v)return '';
  v=String(v).trim();
  return /^https?:\/\//i.test(v)?v:'https://'+v;
}

function score(x){
  let s=20;
  if(x.phone)s+=25;
  if(x.website)s+=15;
  if(x.instagram)s+=10;
  if(x.address)s+=10;
  if(x.email)s+=10;
  if(x.opening)s+=5;
  return Math.min(100,s);
}

function parse(elements,term){
  const map=new Map();
  for(const el of elements||[]){
    const t=el.tags||{},name=t.name||t.brand;
    if(!name)continue;
    const lat=el.lat??el.center?.lat,lon=el.lon??el.center?.lon;
    const address=[t['addr:street'],t['addr:housenumber'],t['addr:suburb'],t['addr:city']].filter(Boolean).join(', ');
    const x={
      id:`${el.type}-${el.id}`,name:String(name),segment:term,address,
      phone:t.phone||t['contact:phone']||t['contact:mobile']||'',
      website:cleanUrl(t.website||t['contact:website']||''),
      instagram:t['contact:instagram']||t.instagram||'',
      email:t.email||t['contact:email']||'',
      opening:t.opening_hours||'',lat,lon,status:'Novo',
      source:'OpenStreetMap / dados públicos'
    };
    x.score=score(x);
    // More reliable duplicate key: normalized name + rounded coordinates.
    const key=norm(x.name)+'|'+(lat&&lon?`${Number(lat).toFixed(4)},${Number(lon).toFixed(4)}`:norm(address));
    const old=map.get(key);
    if(!old || Object.values(x).filter(Boolean).length>Object.values(old).filter(Boolean).length)map.set(key,x);
  }
  return [...map.values()].sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name,'pt-BR'));
}

module.exports=async(req,res)=>{
  res.setHeader('Access-Control-Allow-Origin','*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS')return res.status(204).end();
  if(req.method!=='POST')return json(res,405,{error:'Método não permitido. Use POST.'});
  try{
    const body=typeof req.body==='string'?JSON.parse(req.body||'{}'):(req.body||{});
    const segmento=String(body.segmento||'').trim();
    const cidade=String(body.cidade||'').trim();
    const bairro=String(body.bairro||'').trim();
    const raio=Math.min(Math.max(Number(body.raio)||5000,500),20000);
    const limite=Math.min(Math.max(Number(body.limite)||50,1),200);
    if(!segmento||!cidade)return json(res,400,{error:'Informe segmento e cidade.'});

    const geo=await geocode([bairro,cidade,'Brasil'].filter(Boolean).join(', '));

    let data=await overpass(buildQuery(geo.lat,geo.lon,raio,segmento,false));
    let leads=parse(data.elements,segmento);

    // Fallback: if a sparse area/category produces few results, broaden the public query
    // and retain only records whose public tags/text match the requested segment.
    if(leads.length<Math.min(10,limite)){
      try{
        const broad=await overpass(buildQuery(geo.lat,geo.lon,raio,segmento,true));
        const n=norm(segmento);
        const aliases=n.includes('padar')||n.includes('panific')||n.includes('confeit')
          ? /(padar|panific|confeit|bakery|pao|bread)/i
          : n.includes('barbear') ? /(barbear|hairdresser|barber)/i
          : n.includes('academ') ? /(academ|fitness|gym)/i
          : n.includes('farmac') ? /(farmac|pharm)/i
          : new RegExp(regex(segmento).replace(/\\ /g,'|'),'i');
        const filtered=(broad.elements||[]).filter(e=>aliases.test(JSON.stringify(e.tags||{})));
        const extra=parse(filtered,segmento);
        const seen=new Set(leads.map(x=>norm(x.name)+'|'+norm(x.address||'')));
        for(const x of extra){
          const k=norm(x.name)+'|'+norm(x.address||'');
          if(!seen.has(k)){seen.add(k);leads.push(x);}
        }
      }catch(e){}
    }

    leads=leads.slice(0,limite);
    const message=leads.length
      ? `${leads.length} empresas encontradas em ${geo.display}.`
      : 'Nenhuma empresa encontrada nessa base pública. Tente aumentar o raio ou outro termo.';
    return json(res,200,{ok:true,location:geo,leads,message});
  }catch(e){
    console.error(e);
    return json(res,502,{error:e?.message||'Falha na consulta pública.'});
  }
};