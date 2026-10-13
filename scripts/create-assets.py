"""Regenerate original code-drawn PWA icons/social cover (requires Pillow)."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont
root=Path(__file__).resolve().parent.parent

def icon(size,maskable=False):
    scale=size/512
    im=Image.new('RGB',(size,size),'#304e3e');d=ImageDraw.Draw(im)
    def line(points,width,color):d.line([(int(x*scale),int(y*scale)) for x,y in points],fill=color,width=max(1,int(width*scale)),joint='curve')
    margin=85 if maskable else 65
    d.ellipse((margin*scale,margin*scale,(512-margin)*scale,(512-margin)*scale),outline='#dcd0ad',width=max(1,int(3*scale)))
    line([(139,180),(179,166),(219,168),(256,185),(293,168),(334,166),(373,180),(373,326),(335,314),(294,314),(256,337),(219,314),(178,314),(139,326),(139,180)],12,'#f6edd6')
    line([(256,185),(256,337)],9,'#dcd0ad')
    for y in [221,265]:
        line([(165,y),(193,y-4),(225,y+3)],7,'#dcd0ad');line([(287,y+3),(319,y-4),(347,y)],7,'#dcd0ad')
    return im
for size in [192,512]:icon(size).save(root/f'public/icons/icon-{size}.png')
icon(512,True).save(root/'public/icons/icon-maskable.png')
im=Image.new('RGB',(1200,630),'#f7f3e9');d=ImageDraw.Draw(im)
d.rectangle((35,35,1165,595),outline='#9da887',width=2)
im.paste(icon(180),(85,200))
fontpath=str(root/'public/fonts/AnekOdia-Variable.ttf')
font=ImageFont.truetype(fontpath,70);small=ImageFont.truetype(fontpath,36)
d.text((320,170),'ଅକ୍ଷରଧାରା',font=font,fill='#304e3e')
d.text((320,275),'ଅକ୍ଷରରୁ ଅନନ୍ତ ଯାତ୍ରା…',font=small,fill='#6d795b')
d.text((320,385),'AKSHARADHARA · THE OPEN ODIA LIBRARY',font=ImageFont.truetype(fontpath,28),fill='#53654e')
im.save(root/'public/social-cover.png')
