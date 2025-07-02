/**
 * MIDI and MusicXML Parser for Strudel DAW
 * Handles loading and parsing of music files
 */

class MusicFileParser {
    constructor() {
        this.midiData = null;
        this.musicXMLData = null;
    }

    /**
     * Load and parse a MIDI file
     */
    async loadMIDIFile(file) {
        try {
            const arrayBuffer = await file.arrayBuffer();
            const midiData = this.parseMIDI(arrayBuffer);
            this.midiData = midiData;
            return midiData;
        } catch (error) {
            throw new Error(`MIDI parsing failed: ${error.message}`);
        }
    }

    /**
     * Load and parse a MusicXML file
     */
    async loadMusicXMLFile(file) {
        try {
            const text = await file.text();
            const xmlData = this.parseMusicXML(text);
            this.musicXMLData = xmlData;
            return xmlData;
        } catch (error) {
            throw new Error(`MusicXML parsing failed: ${error.message}`);
        }
    }

    /**
     * Parse MIDI binary data
     */
    parseMIDI(arrayBuffer) {
        const view = new DataView(arrayBuffer);
        let offset = 0;

        // Read MIDI header
        const headerChunk = this.readChunk(view, offset);
        offset += headerChunk.length + 8;

        if (headerChunk.type !== 'MThd') {
            throw new Error('Invalid MIDI file: Missing header');
        }

        const format = view.getUint16(8);
        const trackCount = view.getUint16(10);
        const timeDivision = view.getUint16(12);

        const tracks = [];
        
        // Read all tracks
        for (let i = 0; i < trackCount; i++) {
            const trackChunk = this.readChunk(view, offset);
            offset += trackChunk.length + 8;
            
            if (trackChunk.type === 'MTrk') {
                const track = this.parseTrack(trackChunk.data);
                tracks.push(track);
            }
        }

        return {
            format,
            trackCount,
            timeDivision,
            tracks,
            tempo: 120, // Default tempo
            timeSignature: { numerator: 4, denominator: 4 }
        };
    }

    /**
     * Read a MIDI chunk
     */
    readChunk(view, offset) {
        const type = String.fromCharCode(
            view.getUint8(offset),
            view.getUint8(offset + 1),
            view.getUint8(offset + 2),
            view.getUint8(offset + 3)
        );
        
        const length = view.getUint32(offset + 4);
        const data = new DataView(view.buffer, offset + 8, length);
        
        return { type, length, data };
    }

    /**
     * Parse a MIDI track
     */
    parseTrack(dataView) {
        const events = [];
        let offset = 0;
        let runningStatus = 0;
        let currentTime = 0;

        while (offset < dataView.byteLength) {
            // Read variable-length delta time
            const deltaTime = this.readVariableLength(dataView, offset);
            offset += deltaTime.bytesRead;
            currentTime += deltaTime.value;

            // Read event
            let status = dataView.getUint8(offset);
            
            if (status < 0x80) {
                // Running status
                status = runningStatus;
            } else {
                offset++;
                runningStatus = status;
            }

            const event = this.parseEvent(dataView, offset, status, currentTime);
            events.push(event);
            offset += event.bytesRead;
        }

        return { events };
    }

    /**
     * Parse a MIDI event
     */
    parseEvent(dataView, offset, status, time) {
        const eventType = status & 0xF0;
        const channel = status & 0x0F;

        switch (eventType) {
            case 0x90: // Note On
                return {
                    type: 'noteOn',
                    channel,
                    time,
                    note: dataView.getUint8(offset),
                    velocity: dataView.getUint8(offset + 1),
                    bytesRead: 2
                };

            case 0x80: // Note Off
                return {
                    type: 'noteOff',
                    channel,
                    time,
                    note: dataView.getUint8(offset),
                    velocity: dataView.getUint8(offset + 1),
                    bytesRead: 2
                };

            case 0xB0: // Control Change
                return {
                    type: 'controlChange',
                    channel,
                    time,
                    controller: dataView.getUint8(offset),
                    value: dataView.getUint8(offset + 1),
                    bytesRead: 2
                };

            case 0xFF: // Meta Event
                const metaType = dataView.getUint8(offset);
                const length = this.readVariableLength(dataView, offset + 1);
                return {
                    type: 'meta',
                    metaType,
                    time,
                    data: new Uint8Array(dataView.buffer, dataView.byteOffset + offset + 1 + length.bytesRead, length.value),
                    bytesRead: 1 + length.bytesRead + length.value
                };

            default:
                return {
                    type: 'unknown',
                    status,
                    time,
                    bytesRead: 1
                };
        }
    }

    /**
     * Read variable-length quantity
     */
    readVariableLength(dataView, offset) {
        let value = 0;
        let bytesRead = 0;
        let byte;

        do {
            byte = dataView.getUint8(offset + bytesRead);
            value = (value << 7) | (byte & 0x7F);
            bytesRead++;
        } while (byte & 0x80);

        return { value, bytesRead };
    }

    /**
     * Parse MusicXML
     */
    parseMusicXML(xmlText) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(xmlText, 'text/xml');

        if (xmlDoc.querySelector('parsererror')) {
            throw new Error('Invalid MusicXML format');
        }

        const scorePartwise = xmlDoc.querySelector('score-partwise');
        if (!scorePartwise) {
            throw new Error('Unsupported MusicXML format');
        }

        // Extract basic information
        const work = xmlDoc.querySelector('work work-title');
        const title = work ? work.textContent : 'Untitled';

        const creator = xmlDoc.querySelector('identification creator[type="composer"]');
        const composer = creator ? creator.textContent : 'Unknown';

        // Parse parts
        const parts = [];
        const partElements = xmlDoc.querySelectorAll('part');

        partElements.forEach((partElement, index) => {
            const partId = partElement.getAttribute('id');
            const measures = [];

            const measureElements = partElement.querySelectorAll('measure');
            measureElements.forEach(measureElement => {
                const measure = this.parseMeasure(measureElement);
                measures.push(measure);
            });

            parts.push({
                id: partId,
                name: `Part ${index + 1}`,
                measures
            });
        });

        return {
            title,
            composer,
            parts,
            tempo: 120, // Default, should be extracted from XML
            timeSignature: { numerator: 4, denominator: 4 }
        };
    }

    /**
     * Parse a measure from MusicXML
     */
    parseMeasure(measureElement) {
        const notes = [];
        const noteElements = measureElement.querySelectorAll('note');

        noteElements.forEach(noteElement => {
            const note = this.parseNote(noteElement);
            if (note) {
                notes.push(note);
            }
        });

        return {
            number: measureElement.getAttribute('number'),
            notes
        };
    }

    /**
     * Parse a note from MusicXML
     */
    parseNote(noteElement) {
        const pitch = noteElement.querySelector('pitch');
        if (!pitch) return null; // Rest or other non-pitch element

        const step = pitch.querySelector('step').textContent;
        const octave = parseInt(pitch.querySelector('octave').textContent);
        const alter = pitch.querySelector('alter');
        const alteration = alter ? parseInt(alter.textContent) : 0;

        const duration = noteElement.querySelector('duration');
        const durationValue = duration ? parseInt(duration.textContent) : 0;

        const type = noteElement.querySelector('type');
        const noteType = type ? type.textContent : 'quarter';

        return {
            step,
            octave,
            alteration,
            duration: durationValue,
            type: noteType,
            midiNote: this.stepToMidi(step, octave, alteration)
        };
    }

    /**
     * Convert step/octave to MIDI note number
     */
    stepToMidi(step, octave, alteration = 0) {
        const stepMap = { 'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11 };
        const stepValue = stepMap[step.toUpperCase()];
        return (octave + 1) * 12 + stepValue + alteration;
    }

    /**
     * Convert MIDI data to Strudel pattern
     */
    midiToStrudel(midiData, trackIndex = 0) {
        if (!midiData || !midiData.tracks[trackIndex]) {
            throw new Error('Invalid MIDI data or track index');
        }

        const track = midiData.tracks[trackIndex];
        const noteEvents = track.events.filter(e => e.type === 'noteOn' && e.velocity > 0);
        
        if (noteEvents.length === 0) {
            return 'note("c4").sound("piano")';
        }

        // Group notes by time
        const noteGroups = {};
        noteEvents.forEach(event => {
            const time = Math.floor(event.time / (midiData.timeDivision / 4)); // Quantize to 16th notes
            if (!noteGroups[time]) {
                noteGroups[time] = [];
            }
            noteGroups[time].push(this.midiNoteToName(event.note));
        });

        // Create pattern string
        const times = Object.keys(noteGroups).map(Number).sort((a, b) => a - b);
        const pattern = times.map(time => {
            const notes = noteGroups[time];
            return notes.length > 1 ? `[${notes.join(' ')}]` : notes[0];
        }).join(' ');

        return `note("${pattern}").sound("piano")`;
    }

    /**
     * Convert MusicXML data to Strudel pattern
     */
    musicXMLToStrudel(xmlData, partIndex = 0) {
        if (!xmlData || !xmlData.parts[partIndex]) {
            throw new Error('Invalid MusicXML data or part index');
        }

        const part = xmlData.parts[partIndex];
        const allNotes = [];

        part.measures.forEach(measure => {
            measure.notes.forEach(note => {
                allNotes.push(this.midiNoteToName(note.midiNote));
            });
        });

        if (allNotes.length === 0) {
            return 'note("c4").sound("piano")';
        }

        const pattern = allNotes.join(' ');
        return `note("${pattern}").sound("piano")`;
    }

    /**
     * Convert MIDI note number to note name
     */
    midiNoteToName(midiNote) {
        const noteNames = ['c', 'c#', 'd', 'd#', 'e', 'f', 'f#', 'g', 'g#', 'a', 'a#', 'b'];
        const octave = Math.floor(midiNote / 12) - 1;
        const note = noteNames[midiNote % 12];
        return `${note}${octave}`;
    }

    /**
     * Get track/part information for UI
     */
    getTrackInfo(data, type = 'midi') {
        if (type === 'midi' && data.tracks) {
            return data.tracks.map((track, index) => ({
                index,
                name: `Track ${index + 1}`,
                noteCount: track.events.filter(e => e.type === 'noteOn').length
            }));
        } else if (type === 'musicxml' && data.parts) {
            return data.parts.map((part, index) => ({
                index,
                name: part.name,
                noteCount: part.measures.reduce((count, measure) => count + measure.notes.length, 0)
            }));
        }
        return [];
    }
}

// Export for use in Strudel app
window.MusicFileParser = MusicFileParser;

// ES6 module export
export default MusicFileParser;
export { MusicFileParser };
