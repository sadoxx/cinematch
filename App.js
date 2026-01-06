import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { useEffect, useState } from 'react';
import { db, auth } from './firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut } from 'firebase/auth';

const { height } = Dimensions.get('window');

export default function App() {
  const [movies, setMovies] = useState([]);
  const [user, setUser] = useState(null);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Fetching from TMDB...");
  
  // Auth state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Your TMDB API Key
  const TMDB_API_KEY = "b0e0004308eb345b7717b678714ec34b";

  // Listen to authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Auth state changed:", currentUser?.email || "No user");
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchMoviesFromAPI = async () => {
      try {
        console.log("Fetching movies from TMDB...");
        const response = await fetch(
          `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`
        );
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Fetched data:", data.results?.length, "movies");
        
        if (!data.results || data.results.length === 0) {
          throw new Error("No movies found in API response");
        }
        
        const formattedMovies = data.results.map(movie => ({
          id: movie.id.toString(),
          title: movie.title,
          description: movie.overview,
          posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`
        }));
        
        setMovies(formattedMovies);
        setConnectionStatus("Connected to API 🎬");
        setLoading(false);
      } catch (error) {
        console.error("API error:", error);
        setConnectionStatus(`Error: ${error.message}`);
        setLoading(false);
      }
    };
    
    fetchMoviesFromAPI();
  }, []);

  const handleLike = async () => {
    if (movies.length === 0) return;
    const currentMovie = movies[currentMovieIndex];
    
    try {
      // Save like with real Firebase user ID
      await addDoc(collection(db, "liked_movies"), {
        movieId: currentMovie.id,
        movieTitle: currentMovie.title,
        likedAt: serverTimestamp(),
        userId: user.uid // Real Firebase user ID
      });
      moveToNext();
    } catch (error) {
      console.error("Error saving like:", error);
      alert("Check your Firestore Rules!");
    }
  };

  const moveToNext = () => {
    setCurrentMovieIndex((prev) => (prev + 1) % movies.length);
  };

  // Handle user login
  const handleLogin = async () => {
    setAuthLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      console.log("Login successful!");
    } catch (error) {
      console.error("Login error:", error);
      alert(`Login failed: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle user sign up
  const handleSignUp = async () => {
    setAuthLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      console.log("Sign up successful!");
    } catch (error) {
      console.error("Sign up error:", error);
      alert(`Sign up failed: ${error.message}`);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle user logout
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("Logged out successfully");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Show Auth screen if user is not logged in
  if (!user) {
    return (
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar style="light" />
        <View style={styles.authContainer}>
          <Text style={styles.authTitle}>🎬 CineMatch</Text>
          <Text style={styles.authSubtitle}>Sign in to start matching</Text>
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#666"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#666"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
          />
          
          {authLoading ? (
            <ActivityIndicator size="large" color="#e50914" style={{marginTop: 20}} />
          ) : (
            <>
              <TouchableOpacity 
                style={[styles.authButton, styles.loginButton]} 
                onPress={handleLogin}
              >
                <Text style={styles.authButtonText}>Login</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.authButton, styles.signupButton]} 
                onPress={handleSignUp}
              >
                <Text style={styles.authButtonText}>Sign Up</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={{color: '#fff', marginTop: 10, textAlign: 'center', paddingHorizontal: 20}}>{connectionStatus}</Text>
      </View>
    );
  }

  if (!movies || movies.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={{color: '#fff', fontSize: 18, textAlign: 'center', paddingHorizontal: 20}}>
          {connectionStatus}
        </Text>
        <TouchableOpacity 
          style={[styles.button, styles.likeButton, {marginTop: 20}]} 
          onPress={() => {
            setLoading(true);
            setConnectionStatus("Retrying...");
            setTimeout(() => window.location.reload(), 100);
          }}
        >
          <Text style={styles.buttonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const currentMovie = movies[currentMovieIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header with Logout */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎬 CineMatch</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>
      
      {/* Big Poster: Takes up 70% of the screen */}
      <View style={styles.posterContainer}>
        <Image 
          source={{ uri: currentMovie.posterUrl }} 
          style={styles.fullPoster}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <Text style={styles.movieTitle}>{currentMovie.title}</Text>
        </View>
      </View>

      {/* Scrollable Synopsis: Below the image */}
      <ScrollView style={styles.detailsContainer}>
        <Text style={styles.sectionTitle}>Synopsis</Text>
        <Text style={styles.description}>{currentMovie.description}</Text>
        <View style={{ height: 100 }} /> 
      </ScrollView>

      {/* Buttons: Fixed at the bottom */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={moveToNext}>
          <Text style={styles.buttonText}>⏭️ Skip</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.button, styles.likeButton]} onPress={handleLike}>
          <Text style={styles.buttonText}>❤️ Like</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  posterContainer: {
    height: height * 0.7,
    width: '100%',
  },
  fullPoster: {
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  movieTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  detailsContainer: {
    padding: 20,
    flex: 1,
  },
  sectionTitle: {
    color: '#e50914',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    color: '#ccc',
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 40,
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
  },
  skipButton: {
    backgroundColor: '#333',
  },
  likeButton: {
    backgroundColor: '#e50914',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  authContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#000',
  },
  authTitle: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#e50914',
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 18,
    color: '#ccc',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    backgroundColor: '#222',
    color: '#fff',
    padding: 18,
    borderRadius: 8,
    fontSize: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  authButton: {
    width: '100%',
    paddingVertical: 18,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  loginButton: {
    backgroundColor: '#e50914',
  },
  signupButton: {
    backgroundColor: '#333',
  },
  authButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
    backgroundColor: '#000',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#e50914',
  },
  logoutText: {
    color: '#e50914',
    fontSize: 16,
    fontWeight: '600',
  },
});