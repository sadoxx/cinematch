import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from './firebase'; 
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState("Connecting to TMDB...");
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMoviesFromTMDB = async () => {
      try {
        // This pulls the key safely from your .env file
        const apiKey = process.env.EXPO_PUBLIC_TMDB_API_KEY;
        
        const response = await fetch(
          `https://api.themoviedb.org/3/trending/movie/day?api_key=${apiKey}`
        );
        const data = await response.json();
        
        const formattedMovies = data.results.map(movie => ({
          id: movie.id.toString(),
          title: movie.title,
          description: movie.overview,
          posterUrl: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
        }));
        
        setMovies(formattedMovies);
        setConnectionStatus("Ciné-Match Live 🎬");
        setLoading(false);
      } catch (error) {
        console.error("Error fetching movies:", error);
        setConnectionStatus("Failed to load movies. Check your .env file.");
        setLoading(false);
      }
    };
    
    fetchMoviesFromTMDB();
  }, []);

  const handleLike = async () => {
    if (movies.length === 0) return;
    const currentMovie = movies[currentMovieIndex];
    try {
      await addDoc(collection(db, "liked_movies"), {
        movieId: currentMovie.id,
        movieTitle: currentMovie.title,
        likedAt: serverTimestamp(),
        userId: "User1" 
      });
      moveToNext();
    } catch (error) {
      console.error("Error saving like:", error);
    }
  };

  const moveToNext = () => {
    if (currentMovieIndex < movies.length - 1) {
      setCurrentMovieIndex(currentMovieIndex + 1);
    } else {
      setCurrentMovieIndex(0);
    }
  };

  const currentMovie = movies[currentMovieIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.title}>Ciné-Match</Text>
        <Text style={styles.subtitle}>{connectionStatus}</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#e50914" />
        ) : movies.length > 0 ? (
          <View style={styles.movieCard}>
            <Image 
              source={{ uri: currentMovie.posterUrl }} 
              style={styles.poster}
              resizeMode="cover"
            />
            <View style={styles.infoContainer}>
              <Text style={styles.movieTitle}>{currentMovie.title}</Text>
              <ScrollView style={styles.descScroll}>
                <Text style={styles.movieInfo}>{currentMovie.description}</Text>
              </ScrollView>
            </View>
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={moveToNext}>
                <Text style={styles.buttonText}>⏭️ Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.likeButton]} onPress={handleLike}>
                <Text style={styles.buttonText}>❤️ Like</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <Text style={styles.errorText}>No movies found.</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#141414' },
  header: { paddingTop: 60, paddingBottom: 20, backgroundColor: '#1a1a1a', borderBottomWidth: 1, borderBottomColor: '#333' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#e50914', textAlign: 'center' },
  subtitle: { fontSize: 12, color: '#999', textAlign: 'center', marginTop: 5 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  movieCard: { backgroundColor: '#1f1f1f', borderRadius: 20, width: '100%', height: '85%', overflow: 'hidden', elevation: 10 },
  poster: { width: '100%', height: '60%' },
  infoContainer: { padding: 20, flex: 1 },
  movieTitle: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginBottom: 10 },
  descScroll: { flex: 1 },
  movieInfo: { fontSize: 14, color: '#ccc', lineHeight: 20 },
  buttonContainer: { flexDirection: 'row', padding: 20, gap: 15 },
  button: { flex: 1, paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  skipButton: { backgroundColor: '#333' },
  likeButton: { backgroundColor: '#e50914' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  errorText: { color: '#fff', fontSize: 16 }
});