"""Apply the reviewed field-crop edits to original SVGs; preserve all map paths.

Usage: python scripts/prepare_field_artwork.py SOURCE_DIRECTORY
Run build_field_crops.py first. No raster image generation or network is used.
"""
import hashlib
import json
import re
import sys
import textwrap
from pathlib import Path
from xml.etree import ElementTree as E

ROOT=Path(__file__).resolve().parents[1];SOURCE=Path(sys.argv[1]);LIB=ROOT/'src/lib/gramshakti'
SVG='http://www.w3.org/2000/svg';N={'s':SVG}
E.register_namespace('',SVG);E.register_namespace('xlink','http://www.w3.org/1999/xlink')
def read(name):return json.loads((LIB/name).read_text())
assets=read('asset-manifest.json');records=read('procurement-records.json')['crops'];protection=read('source-records.json');cohort=read('field-crops.json');states=read('state-codes.json')
def norm(s):return re.sub('[^a-z]','',s.lower().replace('&','and'))
aliases={norm(n):c for n,c in states.items()};aliases.update({'orissa':'OR','andamanandnicobar':'AN','jandk':'JK'})
def tag(name):return '{'+SVG+'}'+name
def value(el):return ''.join(el.itertext()).strip()
def position(el):return float(el.get('x',el.get('cx','-9999'))),float(el.get('y',el.get('cy','-9999')))
def bind(el,action,label):
    el.set('data-action',action);el.set('role','button');el.set('tabindex','0');el.set('aria-label',label);el.set('class',(el.get('class','')+' asset-target').strip())
def clear(root,x1,y1,x2,y2):
    for el in list(root):
        x,y=position(el)
        if x1<=x<=x2 and y1<=y<=y2 and el.tag.split('}')[-1] in ['text','rect','circle','line','polygon']:root.remove(el)
def text(root,x,y,content,size=11,color='#173E30',weight='600',action=None,width=None,max_lines=None,line_height=None):
    lines=textwrap.wrap(content,width=width,break_long_words=False,break_on_hyphens=False) if width else [content]
    if max_lines and len(lines)>max_lines:raise ValueError('Text needs a full-record control: '+content[:100])
    el=E.SubElement(root,tag('text'),{'x':str(x),'y':str(y),'class':'sans','fill':color,'font-size':str(size),'font-weight':weight})
    el.text=lines[0] if lines else ''
    for line in lines[1:]:E.SubElement(el,tag('tspan'),{'x':str(x),'dy':str(line_height or size+3)}).text=line
    if action:bind(el,action,content)
    return el
def short_field(content,width,lines,fallback):
    wrapped=textwrap.wrap(content,width=width,break_long_words=False,break_on_hyphens=False)
    return content if len(wrapped)<=lines else fallback
def polygons(d):
    result=[]
    for part in re.split('[Mm]',d)[1:]:
        v=[float(x) for x in re.findall(r'-?\d+(?:\.\d+)?',part)]
        if len(v)>=6:result.append(list(zip(v[::2],v[1::2])))
    return result
def inside(x,y,poly):
    found=False
    for i,(px,py) in enumerate(poly):
        qx,qy=poly[i-1]
        if (py>y)!=(qy>y) and x<(qx-px)*(y-py)/(qy-py)+px:found=not found
    return found
def point(path):
    poly=max(polygons(path.get('d','')),key=len);xs=[p[0] for p in poly];ys=[p[1] for p in poly]
    cx=(min(xs)+max(xs))/2;cy=(min(ys)+max(ys))/2
    choices=[(cx,cy)]+[(min(xs)+(max(xs)-min(xs))*i/32,min(ys)+(max(ys)-min(ys))*j/32) for i in range(1,32) for j in range(1,32)]
    return next(p for p in sorted(choices,key=lambda p:(p[0]-cx)**2+(p[1]-cy)**2) if inside(*p,poly))
def paths(root):
    found={}
    for path in root.findall('.//s:path',N):
        title=path.find('s:title',N)
        if title is not None:
            name=(title.text or '').split(':')[0].strip();code=aliases.get(norm(name))
            if code:found[code]=path;bind(path,'state:'+code,'Open '+name+' sourcing detail');path.set('data-state-name',name)
    return found
def key_name(name):return re.split(r'\s*\(',name)[0].strip()
MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec']
MONTH_PATTERN='January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec'
def window_months(content):
    if re.search(r'round[ -]the[ -]year|year[ -]round|throughout the year|all year',content,re.I):return set(range(12))
    result=set()
    pattern=r'\b('+MONTH_PATTERN+r')\b\s*(?:\d{1,2}(?:st|nd|rd|th)?\s*)?(?:\([^)]*\)\s*)?(?:[–—-]|to|through|until)\s*(?:(?:early|mid|late)[ -]*)?\b('+MONTH_PATTERN+r')\b'
    for match in re.finditer(pattern,content,re.I):
        a=MONTHS.index(match[1][:3].lower());b=MONTHS.index(match[2][:3].lower())
        for step in range(12):
            m=(a+step)%12;result.add(m)
            if m==b:break
    for match in re.finditer(r'\b('+MONTH_PATTERN+r')\b',content,re.I):result.add(MONTHS.index(match[0][:3].lower()))
    return result
def coverage(slug,code=None):
    primary=set();secondary=set()
    for row in records[slug]['calendar']:
        if not row['stateCodes'] or (code and code not in row['stateCodes']):continue
        for window in row['windows']:
            target=secondary if re.search('secondary|warehous|stor',window['label'],re.I) else primary
            target.update(window_months(window['text']))
    return primary,secondary
def arrival_ribbon(root,slug):
    primary,secondary=coverage(slug)
    for rect in root.findall('s:rect',N):
        x,y=position(rect);w=float(rect.get('width','0'));h=float(rect.get('height','0'))
        if 500<=x<=1810 and 235<=y<=250 and 85<w<110 and 30<h<60:
            month=round((x-505)/110)
            if 0<=month<12:rect.set('fill','#5AA84F' if month in primary else '#F5D56A' if month in secondary else '#ECEEEA');bind(rect,'month:'+str(month),'Select '+MONTHS[month]+' source windows')
    for el in root.findall('s:text',N):
        x,y=position(el);v=value(el)
        if x==78 and y==246:el.text='NATIONAL SOURCE AVAILABILITY'
        elif x==78 and y==270:el.text='Named source windows'
        elif y==269 and v in [m.upper() for m in MONTHS]:el.set('fill','#173E30')
        elif y==313:el.text=''
        elif v=='TOP PRODUCING STATES':el.text='SOURCE SNAPSHOT: STATES'
        elif 'Accepted point estimates' in v:el.text='Source snapshot; periods and evidence vary'
        elif v.startswith('Recorded total across mapped accepted rows'):el.text=''
        elif 'District evidence • mandi' in v:el.text='District APY • history • source-labelled estimates'
        elif 'Select a state in the live dashboard' in v:el.text='Select a state for detailed source records'
    clear(root,1480,803,1848,834)
    for x,label,color in [(1480,'Source window','#2E8B57'),(1608,'Stored/secondary','#F5D56A'),(1753,'Not supplied','#ECEEEA')]:
        E.SubElement(root,tag('rect'),{'x':str(x),'y':'812','width':'12','height':'12','rx':'2','fill':color})
        text(root,x+18,822,label,8,'#68766F')

def preview(root,slug):
    clear(root,70,802,641,1030)
    text(root,88,826,'CROP PROTECTION CONTEXT',10,'#0B4D3B','800','protection')
    text(root,88,845,'Key source targets · management modes',10,'#68766F')
    for i,row in enumerate(protection[slug]['protection']):
        name=short_field(key_name(row['name']),50,2,'Open complete regional target '+str(i+1))
        text(root,88,869+i*24,name,9.5,action='target:'+str(i),width=50,max_lines=2,line_height=10)
        text(root,433,869+i*24,' · '.join(row['modes']),8,'#68766F',action='target:'+str(i),width=34,max_lines=2,line_height=10)
    text(root,88,1020,'Open regional pest and management context →',10,'#124B36','800','protection')
def belts(root,slug):
    clear(root,1325,414,1848,707)
    for i,row in enumerate(records[slug]['belts']):
        y=436+47*i;action='source:belt:'+row['id'];color=['#EFA33A','#2E8B70','#8C6BB1','#4C78A8','#C86F32','#D45A5A'][i]
        circle=E.SubElement(root,tag('circle'),{'cx':'1354','cy':str(y-5),'r':'10','fill':color,'fill-opacity':'.16','stroke':color});bind(circle,action,row['variety'])
        name=short_field(row['variety'],70,2,'Open complete commercial variety / grade source →')
        text(root,1378,y,name,9.7,weight='750',action=action,width=70,max_lines=2,line_height=12)
        text(root,1378,y+29,' / '.join(row['stateCodes']) or 'Source geography; open record',8.7,'#68766F',action=action)
def pest_page(root,slug):
    clear(root,70,225,1850,319)
    text(root,82,252,'REGIONAL SOURCE CONTEXT',11,'#124B36','800')
    text(root,82,280,'Pests and diseases by source geography · management modes kept separate',16,'#173E30','750')
    text(root,82,302,'Open each record for its exact geography and source. Current input-supply pressure is not scored.',11,'#68766F')
    for i,row in enumerate(protection[slug]['protection']):
        x=58+611*(i%3);y=335+262*(i//3);action='target:'+str(i)
        clear(root,x+12,y+12,x+584,y+245)
        region=short_field(row['geography'],86,3,'Open the complete source geography →')
        text(root,x+24,y+26,region,9.8,'#68766F','600',action,width=86,max_lines=3,line_height=12)
        name=short_field(row['name'],69,3,'Open the complete pest / disease identity →')
        text(root,x+24,y+78,name,12,'#173E30','800',action,width=69,max_lines=3,line_height=14)
        text(root,x+24,y+133,' · '.join(row['modes']),10,'#124B36','750',action,width=80,max_lines=2,line_height=12)
        impact=re.split(r'(?<=[.!?])\s+',row['impact'])[0]
        impact=short_field(impact,88,3,'Commercial impact is documented in the complete target source.')
        text(root,x+24,y+166,impact,9.6,'#41544A','600',action,width=88,max_lines=3,line_height=12)
        text(root,x+24,y+237,'Open full target source →',10,'#124B36','750',action)
    clear(root,70,866,1849,1028)
    text(root,86,894,'HOW TO USE THIS CONTEXT',11,'#124B36','800')
    text(root,86,923,'Regional evidence supports source screening and verification.',13)
    text(root,86,950,'Management modes describe the source; they are not current treatment instructions.',12,'#68766F')
    text(root,86,977,'No inferred molecule pressure, outbreak prediction, dosage, schedule or PHI.',12,'#68766F')
def processing_page(root,slug,state_paths):
    palette=[cluster['color'].lower() for cluster in assets[slug]['clusters']]
    by_geometry={path.get('d'):code for code,path in state_paths.items()}
    for path in root.findall('.//s:path',N):
        code=by_geometry.get(path.get('d'))
        if code and path.get('stroke','').lower() in palette:
            node=next((i for i,row in enumerate(records[slug]['processing']) if code in row['stateCodes']),None)
            path.set('stroke',palette[node] if node is not None else '#FFFFFF')
            path.set('stroke-width','2.3' if node is not None else '1')
    clear(root,70,230,1848,354)
    text(root,82,250,'SOURCE-LINKED PROCESSING ROLES',10,'#124B36','800')
    text(root,82,281,'3 named processing contexts',20,'#124B36','800')
    text(root,82,312,'Node jurisdiction, catchment and regional varieties remain separate.',12,'#68766F')
    text(root,82,336,'Current operating status and capacity require processor verification.',11,'#68766F')
    text(root,1016,250,'PRODUCT AND VARIETY CONTEXT',10,'#124B36','800')
    text(root,1016,281,'Open a numbered node for the complete record.',15,'#124B36','750')
    text(root,1016,312,'Production estimates are shown separately from Production Context.',11,'#68766F')
    text(root,1016,336,'Full products, catchments, source varieties and briefs appear below.',11,'#68766F')
    clear(root,895,463,1848,1005)
    for index,row in enumerate(records[slug]['processing']):
        y=466+178*index;color=assets[slug]['clusters'][index]['color'];action='cluster:'+str(index)
        card=E.SubElement(root,tag('rect'),{'x':'896','y':str(y),'width':'934','height':'164','rx':'16','fill':'#FCFBF8','stroke':color,'stroke-opacity':'.4'});bind(card,action,row['name']);card.set('data-cluster',str(index))
        circle=E.SubElement(root,tag('circle'),{'cx':'923','cy':str(y+26),'r':'15','fill':color});bind(circle,action,row['name'])
        text(root,918,y+31,str(index+1),12,'#FFFFFF','800',action)
        text(root,950,y+26,row['name'],14,'#173E30','800',action,width=111,max_lines=2,line_height=16)
        text(root,950,y+62,' · '.join(next((n for n,c in states.items() if c==code),code) for code in row['stateCodes']),10,color,'700',action)
        text(root,918,y+84,'REGIONAL CALENDAR VARIETIES',9,'#68766F','750',action)
        varieties=list(dict.fromkeys(v['variety'] for v in row['relatedVarieties']))
        shown=[]
        for item in varieties:
            candidate=' · '.join(shown+[item])
            if len(textwrap.wrap(candidate,67,break_long_words=False,break_on_hyphens=False))>3:break
            shown.append(item)
        text(root,918,y+101,' · '.join(shown) if shown else 'No mapped variety supplied; open source',9.5,'#173E30','650',action,width=67,max_lines=3,line_height=11)
        text(root,1396,y+84,'PRODUCT / SOURCE ROLE',9,'#68766F','750',action)
        role=re.sub(r'^[^:]+:\s*','',row['products'][0]) if row['products'] else 'Full product roles in source record'
        role=short_field(role,66,3,'Open the complete products and processing-role source →')
        text(root,1396,y+101,role,9.5,'#41544A','600',action,width=66,max_lines=3,line_height=11)
        text(root,918,y+150,'Full products, catchments and mapped varieties →',10,color,'750',action)
        # Fix map pins that were assigned using catchments instead of node location.
        pins=[c for c in root.findall('.//s:circle',N) if c.get('stroke','').lower()==color.lower() and 7<=float(c.get('r','0'))<=9 and 70<position(c)[0]<880]
        if not pins:
            shape=next((state_paths[c] for c in row['stateCodes'] if c in state_paths),None)
            if shape is not None:
                x,y=point(shape)
                pin=E.SubElement(root,tag('circle'),{'cx':str(round(x,2)),'cy':str(round(y,2)),'r':'8','fill':'#FFFFFF','stroke':color,'stroke-width':'3'})
                E.SubElement(root,tag('circle'),{'cx':str(round(x,2)),'cy':str(round(y,2)),'r':'3','fill':color})
                pins=[pin]
        for pin in pins:
            ox,oy=position(pin);allowed=[state_paths[c] for c in row['stateCodes'] if c in state_paths]
            if allowed and not any(inside(ox,oy,p) for shape in allowed for p in polygons(shape.get('d',''))):
                nx,ny=point(allowed[0])
                for other in root.findall('.//s:circle',N):
                    if position(other)==(ox,oy):other.set('cx',str(round(nx,2)));other.set('cy',str(round(ny,2)))
            bind(pin,action,row['name']+' · indicative state position');pin.set('data-pin',str(index))
        for label in root.findall('s:text',N):
            if label.get('fill','').lower()==color.lower() and 70<position(label)[0]<880 and 450<position(label)[1]<890:
                label.set('x','100');label.set('y',str(503+index*25));label.text=str(index+1)+'. '+row['stateCodes'][0];bind(label,action,row['name']);label.set('data-pin',str(index))
    for rect in list(root):
        if rect.tag!=tag('rect'):continue
        x,y=position(rect);w=float(rect.get('width','0'));h=float(rect.get('height','0'))
        if 80<x<880 and 450<y<890 and 55<w<225 and 18<h<42 and rect.get('fill','').upper() in ['#FFF','#FFFFFF']:root.remove(rect)

audit=read('artwork-audit.json');rows=[r for r in audit['assets'] if r['crop'] not in cohort]
for slug in cohort:
    manifest=json.loads((SOURCE/'originals'/f'manifest-{slug}.json').read_text())
    for screen in ['002','003','006']:
        raw=(SOURCE/'originals'/f'{slug}-{screen}.svg').read_bytes();digest=hashlib.sha256(raw).hexdigest()
        expected=next(x['sha256'] for x in manifest['outputs'] if x['screen']=='pr'+screen and x['type']=='svg')
        if digest!=expected:raise ValueError('Original source hash mismatch '+slug+'/'+screen)
        root=E.fromstring(raw);geometry=[p.get('d') for p in root.findall('.//s:path',N)];state_paths=paths(root)
        for el in root.findall('.//s:text',N):
            v=value(el);x,y=position(el)
            if x==360 and y==62:el.text='Procurement / '+assets[slug]['name']+(' / Crop protection' if screen=='003' else ' / Processing geography' if screen=='006' else '');bind(el,'directory','Choose another crop')
            elif screen=='002' and y==196:el.text='Original source map • periods and coverage vary • selected-year official records appear below'
            elif 'Peak overrides lean' in v:el.text=''
            elif 'geometry-derived state anchors' in v:el.text='Indicative source geographies • select a state for its evidence'
            elif v.startswith('Bold state outline ='):el.text='Node states and catchments are separate; select a numbered processing context.'
            elif v.startswith('No corridor or facility coordinate'):el.text='Source geographies; exact plant locations require verification.'
            elif y>1040 or 'final static' in v.lower() or v.startswith('State production:') or 'Windows combine displayed' in v or 'Peak = count' in v:el.text=''
            elif v=='Contact Developer':el.text='Change objective';bind(el,'objectives','Change objective')
            elif 'Back to sourcing landscape' in v:bind(el,'landscape','Back to sourcing landscape')
            elif 'REVEAL PROCESSING' in v or 'OFF • overlay' in v:el.text='Open processing geographies →';bind(el,'processing','Open processing geographies')
            elif 'IPM CONTROL AND EVIDENCE' in v:el.text='REGIONAL PEST AND MANAGEMENT CONTEXT'
            elif screen=='003' and y==196:el.text='Source geography • pests and diseases • management modes'
            elif screen=='002' and y==196:el.text='Original source map • periods and coverage vary • selected-year official records appear below'
            elif screen=='002' and y==181:el.text='Static source snapshot'
            elif screen=='003' and y==180:el.text=str(len(protection[slug]['protection']))+' source targets'
            elif screen=='006' and y==180:el.text='3 source nodes'
            if screen=='002' and v in ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']:bind(el,'month:'+str(['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'].index(v)),'Select '+v+' source windows')
            code=aliases.get(norm(re.sub(r'^\d+\.\s*','',v)))
            if code and 430<y<1030:bind(el,'state:'+code,'Open '+v+' sourcing detail')
        if screen=='002':
            preview(root,slug);belts(root,slug);arrival_ribbon(root,slug)
            # Availability cells keep their exact state/month evidence target.
            labels=[el for el in root.findall('s:text',N) if 685<=position(el)[0]<=700 and 850<position(el)[1]<1025]
            for label in labels:
                code=aliases.get(norm(value(label)))
                if not code:continue
                y=position(label)[1]
                primary,secondary=coverage(slug,code)
                for rect in root.findall('s:rect',N):
                    x,ry=position(rect);width=float(rect.get('width','0'));height=float(rect.get('height','0'))
                    if 808<=x<=1730 and 850<=ry<=1025 and 40<width<85 and 10<height<35 and ry<=y<=ry+height+5:
                        month=max(0,min(11,round((x-812)/76)));rect.set('fill','#2E8B57' if month in primary else '#F5D56A' if month in secondary else '#F7F8F5');bind(rect,f'source:availability:{code}:{month}',value(label)+' availability source')
        elif screen=='003':pest_page(root,slug)
        else:processing_page(root,slug,state_paths)
        # A remaining truncated template phrase becomes an explicit source control,
        # never an incomplete factual sentence. Full exact text is in the records.
        for el in root.findall('s:text',N):
            if '…' in value(el):
                action=el.get('data-action','source:register');el.text='Open complete source record →';bind(el,action,'Open complete source record')
        if geometry!=[p.get('d') for p in root.findall('.//s:path',N)]:raise ValueError('Original map geometry changed '+slug+'/'+screen)
        target=ROOT/f'public/gramshakti/crops/{slug}/{screen}.svg';target.parent.mkdir(parents=True,exist_ok=True)
        data=E.tostring(root,encoding='utf-8');target.write_bytes(data)
        rows.append({'crop':slug,'screen':screen,'source_sha256':digest,'application_sha256':hashlib.sha256(data).hexdigest(),'source_geometry_sha256':hashlib.sha256(json.dumps(geometry,separators=(',',':')).encode()).hexdigest(),'map_geometry_preserved':True,'actions':len(root.findall('.//*[@data-action]'))})
audit.update(sources_verified=len(rows),geometry_preserved=len(rows),assets=rows)
(LIB/'artwork-audit.json').write_text(json.dumps(audit,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'new_svg_assets':len(cohort)*3,'source_hashes_verified':True,'map_geometry_preserved':True,'total_svg_assets':len(rows)}))
