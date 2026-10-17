"""Reuse source SVG geometry; apply approved text/pin edits and accessible bindings.

Usage: python scripts/prepare_procurement_artwork.py SOURCE_DIRECTORY
Immutable source hashes are checked against each existing crop manifest.
"""
import hashlib
import json
import math
import re
import textwrap
import sys
from pathlib import Path
from xml.etree import ElementTree as E

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1]) / "originals"
LIB = ROOT / "src/lib/gramshakti"
SVG = "http://www.w3.org/2000/svg"
E.register_namespace("", SVG)
E.register_namespace("xlink", "http://www.w3.org/1999/xlink")
N = {"s": SVG}
assets = json.loads((LIB / "asset-manifest.json").read_text())
all_assets = assets.copy()
field_slugs = set(json.loads((LIB / "field-crops.json").read_text())) if (LIB / "field-crops.json").exists() else set()
assets = {slug: asset for slug, asset in assets.items() if slug not in field_slugs}
records = json.loads((LIB / "procurement-records.json").read_text())["crops"]
protection = json.loads((LIB / "source-records.json").read_text())
states = json.loads((LIB / "state-codes.json").read_text())
canonical = json.loads((LIB / "canonical-crops.json").read_text())
aliases = {re.sub(r"[^a-z]", "", k.lower().replace("&", "and")):v for k,v in states.items()}
aliases.update({"andamanandnicobar":"AN", "jammuandkashmir":"JK", "jandk":"JK", "orissa":"OR"})
PALETTE = ["#EFA33A", "#2E8B70", "#8C6BB1", "#4C78A8", "#C86F32", "#D45A5A", "#49A942"]
changes = []
audit = []

# A regional cultivar link is kept distinct from confirmed processor acceptance.
for slug,asset in assets.items():
    for index,cluster in enumerate(asset['clusters']):
        value=cluster['texts'][4]
        if not value or 'Read full' in value or 'source-linked cultivars' in value:
            varieties=list(dict.fromkeys(v['variety'] for v in records[slug]['processing'][index]['relatedVarieties']))
            cluster['texts'][4]=' · '.join(varieties) if varieties else 'Node-specific variety mapping not supplied'
            cluster['varietyScope']='Regional source context; processor acceptance requires verification'


def tag(name): return f"{{{SVG}}}{name}"
def text(el): return "".join(el.itertext()).strip()
def norm(value): return re.sub(r"[^a-z]", "", value.lower().replace("&", "and"))
def position(el):
    return float(el.get("x", el.get("cx", "-9999"))), float(el.get("y", el.get("cy", "-9999")))


def bind(el, action, label):
    el.set("data-action", action);el.set("role", "button");el.set("tabindex", "0");el.set("aria-label", label)
    el.set("class", (el.get("class", "") + " asset-target").strip())


def add_text(root, x, y, content, size=12, color="#173E30", weight="600", action=None):
    el=E.SubElement(root,tag("text"),{"x":str(x),"y":str(y),"class":"sans","fill":color,"font-size":str(size),"font-weight":weight})
    el.text=content
    if action:bind(el,action,content)
    return el


def clear_rect(root, x1,y1,x2,y2, include_background=False):
    for el in list(root):
        x,y=position(el)
        kind=el.tag.split("}")[-1]
        if x1<=x<=x2 and y1<=y<=y2 and kind in ["text","rect","circle","line","polygon"]:
            if not include_background and kind=="rect" and float(el.get("width","0"))>500 and float(el.get("height","0"))>120:continue
            root.remove(el)


def wrap(el, content, width=64):
    x=el.get("x","0");y=el.get("y","0")
    for child in list(el):el.remove(child)
    lines=textwrap.wrap(content,width=width,break_long_words=False,break_on_hyphens=False)
    el.text=lines[0] if lines else content
    for line in lines[1:3]:
        part=E.SubElement(el,tag("tspan"),{"x":x,"dy":"11"});part.text=line
    if len(lines)>3:
        for child in list(el):el.remove(child)
        el.text="Open the complete source record →"


def polygons(d):
    result=[]
    for part in re.split(r"[Mm]",d)[1:]:
        values=[float(x) for x in re.findall(r"-?\d+(?:\.\d+)?",part)]
        if len(values)>=6:result.append(list(zip(values[::2],values[1::2])))
    return result


def inside(x,y,poly):
    contained=False
    for i,(px,py) in enumerate(poly):
        qx,qy=poly[i-1]
        if (py>y)!=(qy>y) and x<(qx-px)*(y-py)/(qy-py)+px:contained=not contained
    return contained


def point_for(path):
    candidates=polygons(path.get("d",""));poly=max(candidates,key=len)
    xs=[p[0] for p in poly];ys=[p[1] for p in poly];cx=(min(xs)+max(xs))/2;cy=(min(ys)+max(ys))/2
    points=[(cx,cy)]+[(min(xs)+(max(xs)-min(xs))*i/32,min(ys)+(max(ys)-min(ys))*j/32) for i in range(1,32) for j in range(1,32)]
    points.sort(key=lambda p:(p[0]-cx)**2+(p[1]-cy)**2)
    return next(p for p in points if inside(p[0],p[1],poly))


def state_paths(root):
    result={}
    for path in root.findall('.//s:path',N):
        title=path.find('s:title',N)
        if title is not None:
            name=(title.text or '').split(':')[0].strip();code=aliases.get(norm(name))
            if code:
                result[code]=path;bind(path,'state:'+code,'Open '+name+' sourcing detail');path.set('data-state-name',name)
    return result


def relocate(root,needle,code,paths):
    if code not in paths:return
    for circle in root.findall('.//s:circle',N):
        title=circle.find('s:title',N)
        if title is None or needle not in norm(title.text or ''):continue
        ox,oy=position(circle);polys=polygons(paths[code].get('d',''))
        if any(inside(ox,oy,p) for p in polys):continue
        nx,ny=point_for(paths[code]);dx,dy=nx-ox,ny-oy
        for other in root.findall('.//s:circle',N):
            x,y=position(other)
            if abs(x-ox)<.02 and abs(y-oy)<.02:other.set('cx',str(round(nx,2)));other.set('cy',str(round(ny,2)))
        for label in root.findall('.//s:text',N):
            x,y=position(label)
            if abs(x-ox)<26 and abs(y-oy)<16 and float(label.get('font-size','12'))<10:
                label.set('x',str(round(x+dx,2)));label.set('y',str(round(y+dy,2)))
        title.text=(title.text or '').split(' • ')[0]+' · '+code+' · indicative state placement'
        changes.append(f'{needle}: existing marker placed inside {code} source polygon; indicative, not a district centroid')


def belt_ids(slug,label,subline,codes):
    tokens=set(re.findall(r'[a-z]{4,}',(label+' '+subline).lower()))-{'belt','cluster','commercial','variety','group','standard','india','cultivars','source','full'}
    matches=[]
    for row in records[slug]['belts']:
        hay=(row['origin']+' '+row['variety']).lower()
        score=sum(token in hay for token in tokens)+.5*len(set(codes)&set(row['stateCodes']))
        if score:matches.append((score,row['id']))
    if not matches:return []
    best=max(score for score,_ in matches)
    return [id for score,id in matches if score==best]


def rewrite_belts(root,slug):
    native=[]
    text_nodes=root.findall('.//s:text',N)
    titles=sorted([t for t in text_nodes if t.get('x')=='1378' and 420<position(t)[1]<710 and t.get('font-weight')=='800'],key=lambda t:position(t)[1])
    for index,t in enumerate(titles):
        y=position(t)[1];sub=next((x for x in text_nodes if x.get('x')=='1378' and abs(position(x)[1]-(y+18))<.1),None)
        member=next((x for x in text_nodes if x.get('x')=='1640' and abs(position(x)[1]-y)<.1),None)
        label=text(t);subline=text(sub) if sub is not None else '';membership=text(member) if member is not None else ''
        codes=re.findall(r'\b[A-Z]{2}\b',membership)
        ids=belt_ids(slug,label,subline,codes)
        native.append({'name':label,'variety':subline,'membership':membership,'ids':ids,'color':member.get('fill',PALETTE[index%len(PALETTE)]) if member is not None else PALETTE[index%len(PALETTE)]})
    if slug=='litchi' and len(native)>2:native[2]['membership']='BR'
    if slug=='tomato' and native:native[0]['membership']='AP'
    if slug=='capsicum' and len(native)>=4:
        for row,code in zip(native[:4],['WB','HR','HP','JH']):row['membership']=code
        native += [dict(name='Talegaon · Khed · Khandesh · Nashik',variety='Green and protected coloured hybrids',membership='MH',ids=[r['id'] for r in records[slug]['belts'] if 'MH' in r['stateCodes']],color=PALETTE[5]),dict(name='Chikkaballapura · Kolar',variety='Indra and protected coloured hybrids',membership='KA',ids=[r['id'] for r in records[slug]['belts'] if 'KA' in r['stateCodes']],color=PALETTE[6])]
        changes.append('Capsicum: four named belt memberships corrected; Maharashtra and Karnataka contexts added; source-backed Hooghly/Birbhum retained per decision register')
    if slug=='potato' and len(native)>=3:
        native[0].update(name='Agra–Firozabad',membership='UP');native[1].update(name='Hooghly–Bardhaman',membership='WB');native[2].update(name='Farrukhabad–Kannauj',membership='UP')
        native += [dict(name='Malwa Plateau',variety='Kufri Jyoti and processing cultivars',membership='MP',ids=[r['id'] for r in records[slug]['belts'] if 'MP' in r['stateCodes']],color=PALETTE[5]),dict(name='North Gujarat',variety='Processing and contract supply context',membership='GJ',ids=[],color=PALETTE[6])]
        changes.append('Potato: UP/WB belt membership fixed; Malwa and North Gujarat commercial/processing contexts added; unsupported Kashipur corridor withheld')
    if slug=='jackfruit' and len(native)>=5:
        native[0].update(name='Panruti · Cuddalore–Villupuram',variety='Panruti GI · PLR-1 / Palur-2',ids=list(dict.fromkeys(native[0]['ids']+native[4]['ids'])))
        native.pop(4);changes.append('Jackfruit: Panruti/Cuddalore–Villupuram visual belt consolidated; cultivar source rows retained separately')
    clear_rect(root,1325,414,1848,707,True)
    gap=37 if len(native)>6 else 47
    for index,row in enumerate(native):
        y=436+gap*index
        marker=E.SubElement(root,tag('circle'),{'cx':'1355','cy':str(y-5),'r':'10','fill':row['color'],'fill-opacity':'.16','stroke':row['color']})
        action='source:belt:'+','.join(row['ids']) if row['ids'] else 'source:belt-geography:'+row['membership'].replace(' / ',',')
        bind(marker,action,row['name']+' source')
        name=add_text(root,1378,y,row['name'],10.4,weight='800',action=action)
        name.set('data-belt-name',row['name'])
        add_text(root,1780,y,row['membership'],8.8,row['color'],action=action)
        subline=row['variety']
        if '…' in subline or len(subline)>79:subline='Open the exact variety and belt source →'
        add_text(root,1378,y+16,subline,8.8,'#68766F',action=action)
    return native


def protection_preview(root,slug):
    clear_rect(root,70,802,641,1030,True)
    add_text(root,88,826,'CROP PROTECTION CONTEXT',10,'#0B4D3B','800',action='protection')
    add_text(root,88,845,'Source-backed pests, diseases and management modes',10,'#68766F')
    for i,row in enumerate(protection[slug]['protection']):
        name=re.split(r'\s*\(',row['name'])[0]
        add_text(root,88,870+i*23,name,10.5,'#173E30','750',action='target:'+str(i))
        add_text(root,376,870+i*23,' · '.join(row['modes']),8.2,'#68766F',action='target:'+str(i))
    add_text(root,88,1020,'Open regional context →',10,'#124B36','800',action='protection')


def protection_page(root,slug):
    clear_rect(root,70,225,1850,319,True)
    add_text(root,82,252,'REGIONAL SOURCE CONTEXT',11,'#124B36','800')
    add_text(root,82,280,'Pests and diseases by source geography · management modes kept separate',16,'#173E30','750')
    add_text(root,82,302,'Source screening only; no dose, schedule, PHI, outbreak forecast or input-pressure tier.',11,'#68766F')
    for i,row in enumerate(protection[slug]['protection']):
        x=58+611*(i%3);y=335+262*(i//3)
        clear_rect(root,x+15,y+90,x+584,y+224,True)
        for title in root.findall('.//s:text',N):
            tx,ty=position(title)
            if x+12<tx<x+584 and y+10<ty<y+88:bind(title,'target:'+str(i),row['name']+' source')
        add_text(root,x+24,y+112,'MANAGEMENT MODES',9,'#68766F','750')
        add_text(root,x+24,y+137,' · '.join(row['modes']),13,'#124B36','750',action='target:'+str(i))
        first_sentence=re.split(r'(?<=[.!?])\s+',row['impact'])[0]
        lines=textwrap.wrap(first_sentence,width=83,break_long_words=False)
        if len(lines)>4:lines=['Commercial impact is documented in the full source record.']
        for line_no,line in enumerate(lines):add_text(root,x+24,y+163+line_no*14,line,10,'#41544A',action='target:'+str(i))
        add_text(root,x+24,y+227,'Open the full target record →',10,'#124B36','750',action='target:'+str(i))
    clear_rect(root,70,866,1849,1028,True)
    add_text(root,86,894,'HOW TO USE THIS CONTEXT',11,'#124B36','800')
    add_text(root,86,922,'Read the geography and source passage before interpreting crop risk.',13)
    add_text(root,86,947,'Management modes describe the source. They do not confirm an approved chemical use.',13)
    add_text(root,86,972,'Current official labels, local crop stage and commercial verification remain necessary.',13)
    add_text(root,86,1002,'Read the source register →',11,'#124B36','750',action='source:register')


def processing_page(root,slug,paths):
    clear_rect(root,70,230,1848,354,True)
    add_text(root,82,247,'SOURCE-LINKED PROCESSING ROLES',10,'#124B36','800')
    add_text(root,82,278,f"{len(records[slug]['processing'])} named processing contexts",20,'#124B36','800')
    add_text(root,82,309,'Products, node jurisdiction and catchment are separate source fields.',12,'#68766F')
    add_text(root,82,334,'Current operating capacity must be confirmed with each processor.',11,'#68766F')
    add_text(root,1016,247,'PRODUCT AND VARIETY CONTEXT',10,'#124B36','800')
    add_text(root,1016,278,'Open a numbered node to inspect its exact passage.',15,'#124B36','750')
    add_text(root,1016,309,'Quantitative estimates come from Production Context, with their original time basis.',11,'#68766F')
    add_text(root,1016,334,'Full records and printable sourcing briefs appear below.',11,'#68766F')
    coords=[(918,493),(1397,493),(918,766),(1397,766)] if len(assets[slug]['clusters'])==4 else [(918,493),(918,671),(918,849)]
    for index,cluster in enumerate(assets[slug]['clusters']):
        # Existing cards are grouped by numbered circular headings; bind all their original elements.
        titles=root.findall('.//s:text',N)
        number=next((t for t in titles if text(t)==str(index+1) and float(t.get('x','0'))>880 and float(t.get('y','0'))>450),None)
        if number is None:continue
        nx,ny=position(number);left=nx-30;top=ny-27
        right=left+470 if len(assets[slug]['clusters'])==4 else 1850
        height=246 if len(assets[slug]['clusters'])==4 else 163
        for el in root:
            x,y=position(el)
            if left<=x<=right and top<=y<=top+height:
                bind(el,'cluster:'+str(index),records[slug]['processing'][index]['name']);el.set('data-cluster',str(index))
        geography=next((t for t in titles if abs(position(t)[0]-(nx+25))<1 and abs(position(t)[1]-(ny+11))<1),None)
        if geography is not None:
            geography.text=' · '.join(next((n for n,c in states.items() if c==code),code) for code in records[slug]['processing'][index]['stateCodes']) or 'Source jurisdiction'
        for i,t in enumerate(titles):
            if text(t)=='KEY VARIETIES' and left<=position(t)[0]<=right and top<=position(t)[1]<=top+height:
                label=titles[i+1] if i+1<len(titles) else None
                if cluster.get('varietyScope'):t.text='REGIONAL SOURCE VARIETIES'
                if label is not None:wrap(label,cluster['texts'][4] if len(cluster['texts'])>4 else 'Open the exact source record →',72)
    for index,cluster in enumerate(assets[slug]['clusters']):
        color=cluster['color'].lower();row=records[slug]['processing'][index]
        pins=[c for c in root.findall('.//s:circle',N) if c.get('stroke','').lower()==color and 7<=float(c.get('r','0'))<=9 and 70<position(c)[0]<880]
        for circle in pins:
            ox,oy=position(circle);allowed=[paths[code] for code in row['stateCodes'] if code in paths]
            if allowed and not any(inside(ox,oy,poly) for path in allowed for poly in polygons(path.get('d',''))):
                nx,ny=point_for(allowed[0])
                for other in root.findall('.//s:circle',N):
                    x,y=position(other)
                    if abs(x-ox)<.02 and abs(y-oy)<.02:other.set('cx',str(round(nx,2)));other.set('cy',str(round(ny,2)))
                changes.append(slug+': '+row['name']+' marker constrained to source node jurisdiction; indicative state placement')
            bind(circle,'cluster:'+str(index),row['name']+' · indicative node placement');circle.set('data-pin',str(index))
        if pins:
            labels=[t for t in root.findall('.//s:text',N) if t.get('fill','').lower()==color and float(t.get('font-size','12'))<9 and 70<position(t)[0]<880]
            for label in labels:
                label.set('x','100');label.set('y',str(503+index*27));label.text=str(index+1)+'. '+text(label).replace('PACKING &','PACKING HUB');bind(label,'cluster:'+str(index),row['name']+' source');label.set('data-pin',str(index))
    for label in root.findall('s:text',N):
        x,y=position(label)
        if x>880 and text(label).endswith('…'):
            label.text='Open the complete node source →'
    # Original callout backgrounds would otherwise remain empty after the label correction.
    for rect in list(root):
        if rect.tag!=tag('rect'):continue
        x,y=position(rect);w=float(rect.get('width','0'));h=float(rect.get('height','0'))
        if 80<x<880 and 450<y<890 and 55<w<225 and 18<h<42 and rect.get('fill','').upper() in ['#FFF','#FFFFFF']:root.remove(rect)


def correct_belt_pins(root,slug,paths):
    policies={'potato':{1:'UP',2:'WB',3:'UP'},'litchi':{3:'BR'},'tomato':{1:'AP'},'capsicum':{1:'WB',2:'HR',3:'HP',4:'JH'},'pomegranate':{1:'MH'}}
    for circle in list(root.findall('.//s:circle',N)):
        title=circle.find('s:title',N)
        if title is None:continue
        match=re.search(r'Belt (\d+)',title.text or '')
        if not match:continue
        belt=int(match[1]);code=policies.get(slug,{}).get(belt)
        if slug=='jackfruit' and belt==5:
            ox,oy=position(circle)
            for other in list(root):
                if other.tag==tag('circle') and position(other)==(ox,oy) and (other.get('stroke')==circle.get('stroke') or other.get('fill')==circle.get('stroke')):root.remove(other)
            continue
        if not code or code not in paths:continue
        ox,oy=position(circle)
        if not any(inside(ox,oy,p) for p in polygons(paths[code].get('d',''))):
            nx,ny=point_for(paths[code]);color=circle.get('stroke')
            for other in root.findall('.//s:circle',N):
                if position(other)==(ox,oy) and (other.get('stroke')==color or other.get('fill')==color):other.set('cx',str(round(nx,2)));other.set('cy',str(round(ny,2)))
            changes.append(f'{slug}: named belt {belt} marker corrected to {code}; indicative state placement')
        title.text=f'{code} · belt {belt} · indicative state placement'
        circle.set('data-pin-state',code)


for slug,asset in assets.items():
    manifest=json.loads((ROOT/f'src/assets/gramshakti/{slug}/manifest.json').read_text())
    for screen,meta in asset['screens'].items():
        raw=(SOURCE/f'{slug}-{screen}.svg').read_bytes()
        expected=next(x['sha256'] for x in manifest['outputs'] if x['screen']=='pr'+screen and x['type']=='svg')
        actual=hashlib.sha256(raw).hexdigest()
        if actual!=expected:raise ValueError('Source SHA mismatch: '+slug+' '+screen)
        root=E.fromstring(raw);geometry=[p.get('d') for p in root.findall('.//s:path',N)]
        paths=state_paths(root)
        for el in root.findall('.//s:text',N):
            x,y=position(el);value=text(el)
            if x==360 and y==62:
                el.text='Procurement / '+asset['name']+(' / Processing geography' if screen=='006' else ' / Crop protection' if screen=='003' else '')
                bind(el,'directory','Choose another crop');continue
            if y==180 and ('relations' in value or 'mapped hubs' in value):
                el.text=str(len(records[slug]['processing']))+' source nodes' if screen=='006' else str(len(protection[slug]['protection']))+' source targets'
                continue
            if y>1040 or 'final static' in value.lower() or value.startswith('State production:'):
                el.text='';continue
            if 'Windows combine displayed' in value or 'Peak = count' in value:el.text='';continue
            if value=='Contact Developer':el.text='Change objective';bind(el,'objectives','Change objective')
            elif 'Back to sourcing landscape' in value:bind(el,'landscape','Back to sourcing landscape')
            elif value.startswith('Procurement /'):bind(el,'directory','Choose another crop')
            elif 'REVEAL PROCESSING' in value:bind(el,'processing','Open processing geographies')
            elif 'OFF • overlay' in value:el.text='Open source-linked processing nodes →';bind(el,'processing','Open processing nodes')
            elif 'LATEST FINAL YEAR' in value:el.text='SOURCE SNAPSHOT'
            elif 'Official final production' in value:el.text='Source snapshot • classification in state detail'
            elif 'District evidence • mandi' in value:el.text='District APY • historical production • sourced belt estimates'
            elif 'district-centroid pins' in value:el.text='Indicative belt positions • same colour = source context'
            elif 'verified processing cluster' in value:el.text='State outline = source-linked node jurisdiction • pins are indicative'
            elif '>75%' in value:el.text='Source catchment inflows overlap; this is not a current capacity estimate'
            if screen=='003':
                if 'Pesticide pressure' in value:el.text=value.replace('Pesticide pressure','Crop protection')
                if 'FULL PESTICIDE PRESSURE' in value:el.text='REGIONAL PEST AND MANAGEMENT CONTEXT'
                if 'national input-pressure screening' in value:el.text='Source-backed pests and diseases • regional relevance • management modes'
            if 430<y<740 and x==82 and re.match(r'^\d+\. ',value):
                code=aliases.get(norm(re.sub(r'^\d+\. ','',value)))
                if code:bind(el,'state:'+code,'Open '+value+' sourcing detail')
        if screen=='002':
            rewrite_belts(root,slug);protection_preview(root,slug)
            correct_belt_pins(root,slug,paths)
            table_states=sorted([t for t in root.findall('.//s:text',N) if 685<=position(t)[0]<=700 and 850<position(t)[1]<1025],key=lambda t:position(t)[1])
            for label in table_states:
                code=aliases.get(norm(text(label)))
                if not code:continue
                y=position(label)[1]
                for rect in root.findall('s:rect',N):
                    rx,ry=position(rect);w=float(rect.get('width','0'));h=float(rect.get('height','0'))
                    if 808<=rx<=1730 and 850<=ry<=1025 and 40<w<85 and 10<h<35 and ry<=y<=ry+h+5:
                        month=max(0,min(11,round((rx-812)/76)))
                        bind(rect,f'source:availability:{code}:{month}',f'{text(label)} {month+1} availability evidence')
                bind(label,'state:'+code,'Open '+text(label)+' detail')
            for t in root.findall('s:text',N):
                value=text(t).upper();x,y=position(t)
                month_names=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
                if value in month_names and 250<y<280 and x>500:bind(t,'month:'+str(month_names.index(value)),'Select '+value)
        elif screen=='003':protection_page(root,slug)
        else:processing_page(root,slug,paths)
        corrections=[('pineapple','northbengal','WB'),('pineapple','bidhannagar','WB'),('pomegranate','solapur','MH'),('pomegranate','westernmaharashtra','MH'),('apple','kashipur','UK'),('sapota','centralgujarat','GJ'),('potato','agra','UP'),('potato','farrukhabad','UP'),('potato','hooghly','WB'),('tomato','annamayya','AP'),('tomato','southernpeninsular','AP')]
        for crop,needle,code in corrections:
            if crop==slug:relocate(root,needle,code,paths)
        if [p.get('d') for p in root.findall('.//s:path',N)]!=geometry:raise ValueError('Original map/path geometry changed')
        target=ROOT/f'public/gramshakti/crops/{slug}/{screen}.svg';target.parent.mkdir(parents=True,exist_ok=True);data=E.tostring(root,encoding='utf-8');target.write_bytes(data)
        meta['application']=f'/gramshakti/crops/{slug}/{screen}.svg'
        audit.append({'crop':slug,'screen':screen,'source_sha256':actual,'application_sha256':hashlib.sha256(data).hexdigest(),'map_geometry_preserved':True,'actions':len(root.findall('.//*[@data-action]'))})

# PR-001 remains the original 58-crop composition.
root=E.fromstring((SOURCE/'directory.svg').read_bytes())
for el in root.findall('.//s:text',N):
    value=text(el)
    if value in canonical:bind(el,'crop:'+value,'Select '+value)
    elif value in ['Fresh','Processed']:bind(el,value.lower(),value+' procurement')
    elif 'Change objective' in value:bind(el,'objectives','Change objective')
    elif value.startswith('Search'):bind(el,'search','Search crop universe')
(ROOT/'public/gramshakti/directory.svg').write_bytes(E.tostring(root,encoding='utf-8'))
pointer=ROOT/'src/assets/gramshakti/directory.svg.asset.json';d=json.loads(pointer.read_text());d['url']='/gramshakti/directory.svg';pointer.write_text(json.dumps(d,indent=2)+'\n')
all_assets.update(assets)
previous_audit=json.loads((LIB/'artwork-audit.json').read_text()) if (LIB/'artwork-audit.json').exists() else {}
audit=[row for row in previous_audit.get('assets',[]) if row['crop'] in field_slugs]+audit
(LIB/'asset-manifest.json').write_text(json.dumps(all_assets,ensure_ascii=False,indent=2)+'\n')
(LIB/'artwork-audit.json').write_text(json.dumps({'sources_verified':len(audit),'geometry_preserved':len(audit),'assets':audit,'pin_corrections':list(dict.fromkeys(changes))},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'svg_assets':len(audit),'all_source_hashes_match':True,'all_map_geometry_preserved':True,'approved_changes':list(dict.fromkeys(changes))},indent=2))
