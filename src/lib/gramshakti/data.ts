export const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export function selectionSearch(search: Record<string, unknown>): {purpose?: 'fresh' | 'processed'; month?: string} {
  const month = search['month'];
  return { purpose: search['purpose'] === 'processed' ? 'processed' as const : 'fresh' as const, month: typeof month === 'string' && months.includes(month) ? month : undefined };
}
export const categories = [
  {name:'Cereals & Millets', icon:'grain', crops:['Rice','Wheat','Maize','Barley','Sorghum','Pearl Millet','Finger Millet','Small Millets']},
  {name:'Pulses', icon:'bean', crops:['Chickpea','Pigeon Pea','Green Gram','Black Gram','Lentil','Field Pea']},
  {name:'Commercial & Fibre', icon:'sprout', crops:['Cotton','Sugarcane','Jute','Tobacco']},
  {name:'Oilseeds', icon:'seed', crops:['Groundnut','Soybean','Mustard','Sesame','Sunflower','Safflower','Castor','Linseed']},
  {name:'Fruits', icon:'fruit', crops:['Mango','Banana','Citrus','Apple','Grapes','Guava','Pomegranate','Papaya']},
  {name:'Vegetables & Tubers', icon:'carrot', crops:['Potato','Onion','Tomato','Brinjal','Cabbage','Cauliflower','Green Chillies','Tapioca','Okra','Sweet Potato']},
  {name:'Plantation & Nuts', icon:'tree', crops:['Coconut','Arecanut','Cashew','Tea','Coffee','Rubber']},
  {name:'Spices & Condiments', icon:'flower', crops:['Black Pepper','Cardamom','Turmeric','Ginger','Cumin','Coriander','Dry Chillies','Garlic']},
];
export const blocked = ['Maize','Sugarcane','Green Chillies','Tapioca','Arecanut'];
export const states = [
  {code:'AP',name:'Andhra Pradesh', zone:'South'}, {code:'UP',name:'Uttar Pradesh',zone:'North'},
  {code:'KA',name:'Karnataka',zone:'South'},{code:'BR',name:'Bihar',zone:'East'},
  {code:'GJ',name:'Gujarat',zone:'West'},{code:'TN',name:'Tamil Nadu',zone:'South'},
  {code:'MH',name:'Maharashtra',zone:'West'},{code:'TS',name:'Telangana',zone:'South'},
  {code:'WB',name:'West Bengal',zone:'East'},{code:'OR',name:'Odisha',zone:'East'},
  {code:'KL',name:'Kerala',zone:'South'},{code:'MP',name:'Madhya Pradesh',zone:'Central'},
  {code:'JH',name:'Jharkhand',zone:'East'},{code:'RJ',name:'Rajasthan',zone:'North'},
  {code:'PB',name:'Punjab',zone:'North'},{code:'HR',name:'Haryana',zone:'North'},
  {code:'UK',name:'Uttarakhand',zone:'North'},{code:'HP',name:'Himachal Pradesh',zone:'North'},
  {code:'CG',name:'Chhattisgarh',zone:'Central'},{code:'AS',name:'Assam',zone:'Northeast'},
  {code:'GA',name:'Goa',zone:'West'},{code:'NE',name:'Other northeastern states',zone:'Northeast'},
];
export const belts = [
  {name:'Northern plains',geography:'Uttar Pradesh · Bihar',varieties:'Variety linkage pending source verification'},
  {name:'Southern peninsula',geography:'Andhra Pradesh · Telangana · Karnataka · Tamil Nadu',varieties:'Variety linkage pending source verification'},
  {name:'Western coastal belt',geography:'Maharashtra · Gujarat',varieties:'Variety linkage pending source verification'},
];
export const clusters = [
  {id:'chittoor',name:'Chittoor',state:'Andhra Pradesh',code:'AP',product:'Pulp & purée',process:'Fruit preparation, pulping and preservation',catchment:'District-level catchments awaiting the processing crosswalk',varieties:'Source-linked varieties pending',x:58,y:76},
  {id:'krishnagiri',name:'Krishnagiri–Dharmapuri',state:'Tamil Nadu',code:'TN',product:'Pulp & concentrates',process:'Pulping and concentration',catchment:'District-level catchments awaiting the processing crosswalk',varieties:'Source-linked varieties pending',x:53,y:83},
  {id:'konkan',name:'Konkan Coast',state:'Maharashtra',code:'MH',product:'Preserves & pulp',process:'Preserving and pulping',catchment:'Coastal catchment boundaries awaiting evidence',varieties:'Source-linked varieties pending',x:37,y:62},
  {id:'gujarat',name:'Saurashtra & South Gujarat',state:'Gujarat',code:'GJ',product:'Pulp & value-added products',process:'Pulping and value-added processing',catchment:'Node jurisdictions and catchment boundaries awaiting evidence',varieties:'Source-linked varieties pending',x:26,y:47},
];
export const targets = [
  {id:'hopper',name:'Mango hopper',scientific:'Idioscopus spp. · Amritodus atkinsoni',type:'Pests',zone:'South',state:'AP',impact:'Sap-feeding damage to flowering structures.',timing:'Flowering stage — local timing requires a sourced record',categories:['Cultural / prevention','Mechanical / monitoring']},
  {id:'fruit-fly',name:'Fruit fly',scientific:'Bactrocera spp.',type:'Pests',zone:'West',state:'MH',impact:'Larval damage can affect marketable fruit quality.',timing:'Fruit development and ripening — verification pending',categories:['Cultural / prevention','Mechanical / monitoring','Regulatory context']},
  {id:'anthracnose',name:'Anthracnose',scientific:'Colletotrichum spp.',type:'Diseases',zone:'South',state:'TN',impact:'Flower, leaf and fruit lesions; postharvest quality context.',timing:'Weather and crop-stage relevance requires local evidence',categories:['Cultural / prevention','Chemical context']},
  {id:'powdery-mildew',name:'Powdery mildew',scientific:'Oidium mangiferae',type:'Diseases',zone:'North',state:'UP',impact:'Inflorescence infection may affect fruit set.',timing:'Flowering-stage context — source validation pending',categories:['Cultural / prevention','Chemical context']},
  {id:'malformation',name:'Mango malformation',scientific:'Fusarium mangiferae (associated pathogen)',type:'Diseases',zone:'North',state:'UP',impact:'Malformed vegetative growth and inflorescences.',timing:'Affected growth and flowering — regional evidence pending',categories:['Cultural / prevention','Mechanical / monitoring']},
  {id:'bacterial-canker',name:'Bacterial canker',scientific:'Xanthomonas citri pv. mangiferaeindicae',type:'Diseases',zone:'West',state:'GJ',impact:'Leaf and fruit lesions can reduce commercial quality.',timing:'Crop-stage and weather context awaiting source review',categories:['Cultural / prevention','Regulatory context']},
];
export type Evidence = {title:string; passage:string; period:string; nativeUnit:string; displayUnit:string; evidenceClass:string; transformation:string; caveat:string; url?:string};
export function evidence(title:string, passage = 'Exact tab, row or passage has not been supplied.', overrides: Partial<Evidence> = {}): Evidence {
 return {title,passage,period:'2024–25 requested; unverified',nativeUnit:'Not supplied',displayUnit:'Not applicable',evidenceClass:'Awaiting source',transformation:'None — no values inferred or interpolated',caveat:'The referenced evidence file is not attached. This record must not be used as verified procurement evidence.',...overrides};
}
export function pageHead(title:string, description:string) { return {meta:[{title:`${title} | GramShakti`},{name:'description',content:description},{property:'og:title',content:`${title} | GramShakti`},{property:'og:description',content:description},{property:'og:type',content:'website'},{name:'twitter:card',content:'summary_large_image'}]}; }
