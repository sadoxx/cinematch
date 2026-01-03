import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useEffect, useState } from 'react';
import { db } from './firebase';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';

export default function App() {
  const [connectionStatus, setConnectionStatus] = useState("Testing connection...");
  const [isConnected, setIsConnected] = useState(false);
  const [movies, setMovies] = useState([]);
  const [currentMovieIndex, setCurrentMovieIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const testConnectionAndFetchMovies = async () => {
      try {
        // Test connection and fetch movies
        const moviesSnapshot = await getDocs(collection(db, "movies"));
        setConnectionStatus("Connected to Firebase! 🎬");
        setIsConnected(true);
        
        // Convert Firestore documents to array
        const moviesData = moviesSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setMovies(moviesData);
        setLoading(false);
      } catch (error) {
        console.error("Firebase error:", error);
        setConnectionStatus("Connection failed. Check console.");
        setIsConnected(false);
        setLoading(false);
      }
    };
    
    testConnectionAndFetchMovies();
  }, []);

  const handleLike = async () => {
    if (movies.length === 0) return;
    
    const currentMovie = movies[currentMovieIndex];
    
    try {
      // Save the liked movie to a 'liked_movies' collection
      await addDoc(collection(db, "liked_movies"), {
        movieId: currentMovie.id,
        movieTitle: currentMovie.title || "Unknown Movie",
        likedAt: serverTimestamp()
      });
      
      console.log("Movie liked:", currentMovie.title || currentMovie.id);
      
      // Move to next movie
      if (currentMovieIndex < movies.length - 1) {
        setCurrentMovieIndex(currentMovieIndex + 1);
      } else {
        setCurrentMovieIndex(0); // Loop back to start
      }
    } catch (error) {
      console.error("Error saving like:", error);
    }
  };

  const handleSkip = () => {
    // Move to next movie without saving
    if (currentMovieIndex < movies.length - 1) {
      setCurrentMovieIndex(currentMovieIndex + 1);
    } else {
      setCurrentMovieIndex(0); // Loop back to start
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

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#e50914" />
        ) : isConnected ? (
          <>
            {movies.length > 0 ? (
              <View style={styles.movieCard}>
                <Text style={styles.movieTitle}>
                  {currentMovie?.title || `Movie ${currentMovieIndex + 1}`}
                </Text>
                <Text style={styles.movieInfo}>
                  {currentMovie?.description || "No description available"}
                </Text>
                <Text style={styles.movieCounter}>
                  {currentMovieIndex + 1} / {movies.length}
                </Text>
                
                <View style={styles.buttonContainer}>
                  <TouchableOpacity 
                    style={[styles.button, styles.skipButton]} 
                    onPress={handleSkip}
                  >
                    <Text style={styles.buttonText}>⏭️ Skip</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.button, styles.likeButton]} 
                    onPress={handleLike}
                  >
                    <Text style={styles.buttonText}>❤️ Like</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.noMoviesCard}>
                <Text style={styles.noMoviesText}>
                  No movies found. Add some movies to your Firestore 'movies' collection!
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>
              Unable to connect to Firebase. Please check your configuration.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#141414',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1a1a1a',
    borderBottomWidth: 2,
    borderBottomColor: '#e50914',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#e50914',
    textAlign: 'center',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  movieCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  movieTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  movieInfo: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 24,
  },
  movieCounter: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    gap: 15,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
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
  noMoviesCard: {
    backgroundColor: '#1f1f1f',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 400,
  },
  noMoviesText: {
    fontSize: 16,
    color: '#ccc',
    textAlign: 'center',
    lineHeight: 24,
  },
  errorCard: {
    backgroundColor: '#331111',
    borderRadius: 16,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e50914',
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
    textAlign: 'center',
    lineHeight: 24,
  },
});
