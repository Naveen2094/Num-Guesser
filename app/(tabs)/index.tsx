import { Audio } from 'expo-av';
import * as Speech from 'expo-speech';
import React, { useEffect, useRef, useState } from 'react';
import { Button, LayoutAnimation, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, UIManager, View } from 'react-native';
import ParticleBackground from '../../components/ParticleBackground';

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type ThemeType = 'cyan' | 'red' | 'purple';
type DifficultyType = 'easy' | 'medium' | 'hard';

const NumberGuesserScreen: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<ThemeType>('cyan');
  const themeColors: Record<ThemeType, [string, string, string]> = {
    cyan: ['#00ffe1', '#00ff99', '#0a0a0a'],
    red: ['#ff0066', '#ffdd33', '#140012'],
    purple: ['#b56cff', '#7effe6', '#12072a'],
  };
  const [accent, accent2, bg] = themeColors[theme];

  // Difficulty
  const [difficulty, setDifficulty] = useState<DifficultyType>('medium');

  // Game state
  const [low, setLow] = useState(1);
  const [high, setHigh] = useState(100);
  const [guess, setGuess] = useState<number | null>(null);
  const [tries, setTries] = useState(0);
  const [status, setStatus] = useState('Think of a number and press Start!');
  const [gameStarted, setGameStarted] = useState(false);

  // Sound refs
  const beepSound = useRef<Audio.Sound>(new Audio.Sound());
  const successSound = useRef<Audio.Sound>(new Audio.Sound());

  // Load sounds
  useEffect(() => {
    loadSounds();
    return () => {
      beepSound.current.unloadAsync();
      successSound.current.unloadAsync();
    };
  }, []);

  const loadSounds = async () => {
    await beepSound.current.loadAsync(require('../../assets/sounds/beep.mp3'));
    beepSound.current.setVolumeAsync(0.25);
    await successSound.current.loadAsync(require('../../assets/sounds/success.mp3'));
    successSound.current.setVolumeAsync(0.4);
  };

  // TTS
  const speak = (txt: string) => {
    Speech.speak(txt, { rate: 1.08, pitch: 1.2 });
  };

  // Set range based on difficulty
  const setRange = () => {
    switch (difficulty) {
      case 'easy': setLow(1); setHigh(50); break;
      case 'hard': setLow(1); setHigh(1000); break;
      default: setLow(1); setHigh(100);
    }
  };

  // Start game
  const startGame = () => {
  let newLow: number, newHigh: number;
  switch (difficulty) {
    case 'easy': newLow = 1; newHigh = 50; break;
    case 'hard': newLow = 1; newHigh = 1000; break;
    default: newLow = 1; newHigh = 100;
  }

  setLow(newLow);
  setHigh(newHigh);
  setTries(0);
  setGuess(null);
  setStatus('AI is guessing...');
  setGameStarted(true);

  nextGuess(newLow, newHigh, 0); // use local values to start fresh
  speak('Let me guess your number');
};


  const nextGuess = (newLow: number, newHigh: number, newTries: number) => {
    if (newLow > newHigh) {
      setGuess(null);
      setStatus('I give up 🤯 Play again!');
      setGameStarted(false);
      return;
    }
    const g = Math.floor((newLow + newHigh) / 2);
    setLow(newLow);
    setHigh(newHigh);
    setGuess(g);
    setTries(newTries + 1);
    beepSound.current.replayAsync();
    speak(`Is it ${g}?`);
  };

  const handleLow = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    nextGuess((guess ?? 1) + 1, high, tries);
  };
  const handleHigh = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    nextGuess(low, (guess ?? 100) - 1, tries);
  };
  const handleCorrect = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    successSound.current.replayAsync();
    setStatus(`Guessed in ${tries} tries!`);
    speak(`Yay! I guessed it in ${tries} tries`);
    setGameStarted(false);
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: bg }]}>
      <ParticleBackground color={accent} />

      <Text style={[styles.title, { color: accent, textShadowColor: accent }]}>
        AI Number Guesser
      </Text>

      <View style={[styles.panel, { borderColor: accent, shadowColor: accent }]}>
        {/* Theme picker */}
        <Text style={{ color: '#eee', marginBottom: 8 }}>Select Theme:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
          {(['cyan', 'red', 'purple'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTheme(t)}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: themeColors[t][0],
                borderWidth: theme === t ? 2 : 1,
                borderColor: theme === t ? accent : '#fff4',
              }}
            />
          ))}
        </View>

        {/* Difficulty picker */}
        <Text style={{ color: '#eee', marginBottom: 8 }}>Select Difficulty:</Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 }}>
          {(['easy', 'medium', 'hard'] as const).map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDifficulty(d)}
              style={{
                padding: 8,
                borderRadius: 8,
                backgroundColor: difficulty === d ? accent : '#333',
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '600' }}>{d.charAt(0).toUpperCase() + d.slice(1)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="Start Game" onPress={startGame} disabled={gameStarted} />

        <Text style={styles.status}>{status}</Text>
        {guess !== null && <Text style={[styles.guess, { color: accent2 }]}>{guess}</Text>}

        {gameStarted && (
          <View style={styles.controls}>
            <Button title="Too Low" onPress={handleLow} />
            <Button title="Correct" onPress={handleCorrect} />
            <Button title="Too High" onPress={handleHigh} />
          </View>
        )}
      </View>
    </ScrollView>
  );
};

export default NumberGuesserScreen;

const styles = StyleSheet.create({
  container: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 20, textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 10 },
  panel: { width: '90%', padding: 20, borderRadius: 20, backgroundColor: '#111418cc', borderWidth: 1, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, alignItems: 'center' },
  status: { fontSize: 16, color: '#eee', marginVertical: 12 },
  guess: { fontSize: 36, fontWeight: 'bold', marginVertical: 12 },
  controls: { flexDirection: 'row', justifyContent: 'space-between', width: '100%', marginTop: 12 },
});
