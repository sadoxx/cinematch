import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp, onSnapshot, query } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const { height } = Dimensions.get('window');
const TMDB_KEY = "b0e0004308eb345b7717b678714ec34b";

export default function App() {
  const [movies, setMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // 1. Handle Auth Session
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  // 2. Fetch Movies
  useEffect(() => {
    fetch(`https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_KEY}`)
      .then(res => res.json())
      .then(data => {
        const formatted = data.results.map(m => ({
          id: m.id.toString(),
          title: m.title,
          overview: m.overview,
          poster: `https://image.tmdb.org/t/p/w500${m.poster_path}`
        }));
        setMovies(formatted);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, []);

  // 3. Listen for Matches
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, "liked_movies"));
    const unsub = onSnapshot(q, (snapshot) => {
      const likes = snapshot.docs.map(d => d.data());
      
      // Check for duplicates
      const likesByMovie = {};
      likes.forEach(item => {
        if (!likesByMovie[item.movieId]) likesByMovie[item.movieId] = [];
        likesByMovie[item.movieId].push(item.userId);
      });

      for (const movieId in likesByMovie) {
        const uniqueUsers = new Set(likesByMovie[movieId]);
        if (uniqueUsers.size >= 2) {
          const movie = likes.find(l => l.movieId === movieId);
          Alert.alert("It's a Match!", `You both liked ${movie.movieTitle}`);
        }
      }
    });

    return () => unsub();
  }, [user]);

  const handleLike = async () => {
    if (!movies[index]) return;
    
    try {
      await addDoc(collection(db, "liked_movies"), {
        movieId: movies[index].id,
        movieTitle: movies[index].title,
        userId: user.uid,
        timestamp: serverTimestamp()
      });
      setIndex((prev) => (prev + 1) % movies.length);
    } catch (err) {
      Alert.alert("Error", err.message);
    }
  };

  const handleAuth = async (isLogin) => {
    setAuthLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err) {
      Alert.alert("Auth Error", err.message);
    }
    setAuthLoading(false);
  };

  if (!user) {
    return (
      <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <StatusBar style="light" />
        <View style={styles.center}>
          <Text style={styles.title}>CineMatch 🎬</Text>
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#666" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none"
          />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor="#666" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
          
          {authLoading ? <ActivityIndicator color="#e50914" /> : (
            <View style={{width: '100%', gap: 10}}>
              <TouchableOpacity style={styles.btnMain} onPress={() => handleAuth(true)}>
                <Text style={styles.btnText}>Log In</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSec} onPress={() => handleAuth(false)}>
                <Text style={styles.btnText}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color="#e50914"/></View>;

  const movie = movies[index];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>CineMatch</Text>
        <TouchableOpacity onPress={() => signOut(auth)}><Text style={styles.logout}>Logout</Text></TouchableOpacity>
      </View>

      <View style={styles.posterWrapper}>
        <Image source={{ uri: movie.poster }} style={styles.poster} resizeMode="cover"/>
        <View style={styles.gradient}><Text style={styles.movieName}>{movie.title}</Text></View>
      </View>

      <ScrollView style={styles.info}>
        <Text style={styles.overview}>{movie.overview}</Text>
      </ScrollView>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.btnSkip} onPress={() => setIndex((prev) => (prev + 1) % movies.length)}>
          <Text style={styles.btnText}>Skip</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnLike} onPress={handleLike}>
          <Text style={styles.btnText}>Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 40, fontWeight: 'bold', color: '#e50914', marginBottom: 40 },
  input: { width: '100%', backgroundColor: '#222', color: '#fff', padding: 15, borderRadius: 8, marginBottom: 15, fontSize: 16 },
  btnMain: { backgroundColor: '#e50914', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnSec: { backgroundColor: '#333', padding: 15, borderRadius: 8, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, paddingTop: 50 },
  headerTitle: { color: '#e50914', fontSize: 24, fontWeight: 'bold' },
  logout: { color: '#fff', fontSize: 16 },
  posterWrapper: { height: height * 0.65, width: '100%' },
  poster: { width: '100%', height: '100%' },
  gradient: { position: 'absolute', bottom: 0, width: '100%', padding: 20, backgroundColor: 'rgba(0,0,0,0.6)' },
  movieName: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  info: { padding: 20 },
  overview: { color: '#ccc', fontSize: 16, lineHeight: 24 },
  controls: { flexDirection: 'row', padding: 20, gap: 15, position: 'absolute', bottom: 30, width: '100%' },
  btnSkip: { flex: 1, backgroundColor: '#333', padding: 18, borderRadius: 30, alignItems: 'center' },
  btnLike: { flex: 1, backgroundColor: '#e50914', padding: 18, borderRadius: 30, alignItems: 'center' }
});