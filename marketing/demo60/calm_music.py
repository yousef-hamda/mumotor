import numpy as np, wave
SR=48000; DUR=68.5; N=int(SR*DUR); t=np.arange(N)/SR; mix=np.zeros(N)
def env(a,d,s,r,length,sus=0.7):
    n=int(length*SR); e=np.zeros(n); ai=int(a*SR); di=int(d*SR); ri=int(r*SR)
    if ai>0:e[:ai]=np.linspace(0,1,ai)
    if di>0:e[ai:ai+di]=np.linspace(1,sus,di)
    e[ai+di:n-ri]=sus
    if ri>0:e[n-ri:]=np.linspace(sus,0,ri)
    return e
def tone(f,length,harm=(1,.5,.28,.14),detune=0.0):
    n=int(length*SR); tt=np.arange(n)/SR; y=np.zeros(n)
    for i,a in enumerate(harm): y+=a*np.sin(2*np.pi*f*(i+1)*(1+detune)*tt)
    return y/sum(harm)
def place(sig,start):
    s=int(start*SR); e=min(N,s+len(sig))
    if s<N: mix[s:e]+=sig[:e-s]
# calm chord bed: slow warm pads, 1 chord per 4s
prog=[[261.63,329.63,392.00],[220.00,261.63,329.63],[196.00,246.94,293.66],[174.61,220.00,261.63]]  # C Am G F
bar=4.0
for b in range(int(DUR/bar)+1):
    st=b*bar; ch=prog[b%4]; grow=min(1.0,0.5+b*0.05)
    for f in ch:
        place(tone(f,bar*1.05,harm=(1,.4,.16),detune=0.003)*env(0.6,0.4,0.75,0.9,bar*1.05)*0.15*grow,st)
        place(tone(f*2,bar*1.05,harm=(1,.3),detune=0.004)*env(0.8,0.5,0.6,0.9,bar*1.05)*0.05*grow,st)  # airy octave
    place(tone(ch[0]/2,bar*1.0,harm=(1,.25))*env(0.3,0.3,0.8,0.6,bar*1.0)*0.16*(1 if st>4 else 0),st)  # soft sub bass
# gentle bell arp (sparse, calm)
notes=[523.25,659.25,783.99,659.25]
b=0
while b*2.0<DUR:
    st=b*2.0
    if st>6:
        f=notes[b%len(notes)]
        place(tone(f,1.6,harm=(1,.5,.25))*np.exp(-np.arange(int(1.6*SR))/SR*3.2)*0.06*min(1,(st-6)/6),st)
    b+=1
# very soft shaker for gentle motion (no kick)
def shaker(l=0.05): n=int(l*SR); return np.random.randn(n)*np.exp(-np.arange(n)/SR*70)*0.03
b=0
while b*0.5<DUR:
    st=b*0.5
    if 12<st<62: place(shaker(),st)
    b+=1
# soft dings only at key moments
def ding(f=784,l=1.0): return (tone(f,l,harm=(1,.5,.25))*np.exp(-np.arange(int(l*SR))/SR*4.5))*0.14
for dd in [3.9,22.0,32.4,52.5,66.6]: place(ding(),dd)
# final gentle resolve
for f in [261.63,329.63,392.00,523.25]:
    place(tone(f,4.5,harm=(1,.4,.2))*env(0.8,0.4,0.7,3.0,4.5)*0.11,64.5)
mix*=0.95; mix=np.tanh(mix*1.0)
fin=int(1.0*SR); fout=int(1.6*SR)
mix[:fin]*=np.linspace(0,1,fin); mix[-fout:]*=np.linspace(1,0,fout)
data=np.clip(np.stack([mix,mix],1),-1,1); pcm=(data*32767).astype(np.int16)
with wave.open('audio/calm.wav','w') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(pcm.tobytes())
print('wrote calm.wav',DUR,'s')
