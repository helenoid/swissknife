# Strudel Live DAW - Complete Guide

## 🎵 Welcome to Your Professional Music Production Suite

Strudel Live is now a fully-featured Digital Audio Workstation (DAW) with advanced capabilities for music composition, arrangement, and production. Here's everything you can do:

## 🚀 Quick Start

1. **Launch Strudel**: Click the Strudel icon on the SwissKnife desktop
2. **Load Your Music**: 
   - Drag & drop your MIDI (.mid) or MusicXML (.musicxml) files
   - Or click "📁 Load Music File" to browse
3. **Start Creating**: Use the code editor or visual tools to compose

## 🎼 Music File Support

### Supported Formats
- **MIDI Files** (.mid, .midi) - Full MIDI import with track selection
- **MusicXML** (.musicxml, .xml) - Sheet music import with part selection

### Your Polyphia Files
Your "Playing God" files have been moved to `/web/assets/music/`:
- `playing-god.mid` - MIDI version
- `playing-god-piano.musicxml` - Piano sheet music

To load them:
1. Click "📁 Load Music File"
2. Navigate to the music files
3. Select the track/part you want to work with
4. The pattern will be automatically converted to Strudel code

## 🎛️ DAW Features

### 1. Multi-Track Sequencer
- **Pattern Layers**: Create unlimited instrument layers
- **Timeline**: Visual arrangement with drag-and-drop clips
- **Loop Sections**: Set custom loop points for jamming
- **Record Mode**: Capture your performances

### 2. Advanced Code Editor
- **Syntax Highlighting**: Strudel-aware code completion
- **Live Evaluation**: Instant pattern updates (Ctrl+Enter)
- **Pattern Library**: Pre-built examples and Polyphia demos
- **Multi-Tab Support**: Work on multiple compositions

### 3. Professional Mixer
- **Per-Channel EQ**: High, Mid, Low frequency control
- **Built-in Effects**: Reverb, Delay, Compression, Distortion
- **Master Chain**: Professional mastering effects
- **Level Meters**: Real-time audio monitoring

### 4. Piano Roll Editor
- **Visual Note Editing**: Click and drag to create melodies
- **Velocity Control**: Adjust note dynamics
- **Quantization**: Perfect timing assistance
- **Zoom & Pan**: Navigate large compositions

### 5. Real-Time Visualization
- **Waveform Display**: See your audio in real-time
- **Spectrum Analyzer**: Monitor frequency content
- **Performance Pads**: Trigger effects and transitions

### 6. Export Capabilities
- **Audio Export**: WAV (uncompressed) and MP3 (compressed)
- **MIDI Export**: Save your compositions as standard MIDI
- **Project Save/Load**: Preserve your work

## 🎸 Polyphia Demo Presets

Access professional-quality patterns inspired by Polyphia:

### Available Presets
1. **🎸 Polyphia Lead** - Technical lead guitar with tapping
2. **🎸 Rhythm Guitar** - Complex palm-muted rhythms
3. **🎸 Bass Line** - Progressive bass with slides
4. **🥁 Progressive Drums** - Polyrhythmic drum patterns
5. **🎹 Ambient Pad** - Atmospheric backgrounds

### Full Demo
Click "🎸 Load Polyphia Demo" to load a complete multi-track composition showcasing all elements together.

## 🎮 Performance Mode

### Live Performance Pads
- **SOLO/MUTE**: Isolate or silence tracks
- **FILTER**: Sweep filter for builds
- **STUTTER**: Rhythmic gating effect
- **REVERSE**: Backward audio effect
- **CRUSH**: Bitcrushing distortion
- **BUILD**: Filter sweep with tension
- **DROP**: Dramatic filter/volume release

### Real-Time Control
- **Tap Tempo**: Click to set BPM
- **Master Volume**: Control overall output
- **Effect Sends**: Adjust reverb and delay levels

## 🔧 Advanced Production

### Effects Chain
Each track has a complete effects chain:
1. **Input Gain**
2. **3-Band EQ** (High, Mid, Low)
3. **Compressor** (automatic dynamics)
4. **Channel Reverb** (space and depth)
5. **Channel Delay** (rhythmic echoes)
6. **Master Bus** (final processing)

### Automation
- **Filter Sweeps**: Automated cutoff control
- **Volume Automation**: Dynamic level changes
- **Effect Parameters**: Automate any knob or slider

### Pattern Composition
```javascript
// Example: Tech-metal inspired pattern
stack(
  // Lead guitar with tapping
  note("g4 a4 b4 d5 g5 d5 b4 a4").sound("guitar").delay(0.25),
  
  // Rhythm guitar with palm muting
  note("g3 ~ d3 ~ g3 ~ f#3 ~").sound("guitar").cutoff(600),
  
  // Progressive bass
  note("g1 ~ g1 d2 ~ g1 ~ f#1").sound("bass").lpf(400),
  
  // Complex drums
  stack(
    bd("1 ~ ~ 1 ~ ~ 1 ~"),    // Kick
    sd("~ ~ 1 ~ ~ 1 ~ ~"),    // Snare
    hh("1 ~ 1 1 ~ 1 ~ 1")     // Hi-hat
  )
)
```

## 🎯 Workflow Tips

### Getting Started
1. **Load a Reference**: Import your MIDI/MusicXML files
2. **Layer by Layer**: Build tracks one instrument at a time
3. **Use Presets**: Start with Polyphia demos and modify
4. **Live Performance**: Use performance pads while playing

### Pro Techniques
- **Ctrl+Enter**: Quick pattern evaluation
- **Drag & Drop**: Load multiple music files at once
- **Layer Combination**: Mix programmed and imported parts
- **Real-time Effects**: Use performance pads during playback

### Keyboard Shortcuts
- `Ctrl+Enter`: Evaluate current pattern
- `Space`: Play/Pause (when implemented)
- `Esc`: Stop all playback
- `Tab`: Switch between editor tabs

## 🔊 Audio Quality

### Sample Rate & Bit Depth
- 44.1kHz/16-bit minimum
- Up to 96kHz/24-bit support
- Professional-grade audio processing

### Latency Optimization
- Web Audio API for minimal latency
- Real-time monitoring and effects
- Optimized for modern browsers

## 🎨 Customization

### Visual Themes
- Dark mode optimized for studio work
- High contrast accessibility options
- Responsive design for all screen sizes

### Workspace Layout
- Resizable panels
- Dockable windows
- Custom toolbar arrangements

## 🆘 Troubleshooting

### Common Issues
1. **No Audio**: Check browser audio permissions
2. **File Won't Load**: Ensure MIDI/MusicXML format
3. **Performance Issues**: Close other browser tabs
4. **Export Problems**: Check available disk space

### Browser Compatibility
- **Best**: Chrome, Edge (Chromium-based)
- **Good**: Firefox, Safari
- **Required**: Web Audio API support

## 🚀 What's Next

### Planned Features
- **VST Plugin Support**: Load external instruments
- **Advanced Automation**: Bezier curve editing
- **Collaboration**: Real-time multi-user editing
- **Cloud Sync**: Save projects to cloud storage
- **Mobile App**: iOS/Android companion

### Contributing
This is part of the SwissKnife ecosystem. Contributions welcome!

---

## 🎵 Start Creating!

Your Polyphia files are ready to load, the synthesizers are warmed up, and the stage is set. Welcome to the future of browser-based music production!

**Happy composing! 🎶**
