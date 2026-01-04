import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image, Dimensions } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from './firebase'; //
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const { height } = Dimensions.get('window');

export default function App() {
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("Fetching from TMDB...");

  // Your TMDB API Key
  const TMDB_API_KEY = "b0e0004308eb345b7717b678714ec34b";

  useEffect(() => {
    const fetchMoviesFromAPI = async () => {
      try {
        // Fetching directly from TMDB API instead of Firestore
        const response = await fetch(
          `https://api.themoviedb.org/3/trending/movie/day?api_key=${TMDB_API_KEY}`
        );
        const data = await response.json();
        
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
        setConnectionStatus("Failed to load movies.");
        setLoading(false);
      }
    };
    
    fetchMoviesFromAPI();
  }, []);

  const handleLike = async () => {
    if (movies.length === 0) return;
    const currentMovie = movies[currentMovieIndex];
    
    try {
      // Still uses Firebase to save your "Likes"
      await addDoc(collection(db, "liked_movies"), {
        movieId: currentMovie.id,
        movieTitle: currentMovie.title,
        likedAt: serverTimestamp(),
        userId: "User1" 
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#e50914" />
        <Text style={{color: '#fff', marginTop: 10}}>{connectionStatus}</Text>
      </View>
    );
  }

  const currentMovie = movies[currentMovieIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
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
});