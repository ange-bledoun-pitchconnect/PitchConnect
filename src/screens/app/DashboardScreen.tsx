'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { mobileAuth } from '../../lib/mobile-auth';

interface DashboardData {
  playerStats: {
    totalPlayers: number;
    avgRating: number;
  };
  recentMatches: Array<{
    id: string;
    homeTeam: string;
    awayTeam: string;
    score: string;
    date: string;
  }>;
}

const DashboardScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const session = await mobileAuth.getSession();
      if (!session) return;

      const response = await axios.get(
        `${process.env.EXPO_PUBLIC_API_URL}/api/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${session.accessToken}`,
          },
        }
      );

      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0891b2" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.title}>Dashboard</Text>
        </View>

        {data && (
          <>
            {/* Stats Cards */}
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{data.playerStats.totalPlayers}</Text>
                <Text style={styles.statLabel}>Players</Text>
              </View>

              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {data.playerStats.avgRating.toFixed(1)}
                </Text>
                <Text style={styles.statLabel}>Avg Rating</Text>
              </View>
            </View>

            {/* Recent Matches */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Recent Matches</Text>

              {data.recentMatches.map((match) => (
                <View key={match.id} style={styles.matchCard}>
                  <View style={styles.matchTeams}>
                    <Text style={styles.teamName}>{match.homeTeam}</Text>
                    <Text style={styles.score}>{match.score}</Text>
                    <Text style={styles.teamName}>{match.awayTeam}</Text>
                  </View>
                  <Text style={styles.matchDate}>{match.date}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={fetchDashboardData}
        >
          <Text style={styles.refreshButtonText}>Refresh</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0891b2',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  matchCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  matchTeams: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  teamName: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  score: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0891b2',
    marginHorizontal: 12,
  },
  matchDate: {
    fontSize: 12,
    color: '#999',
  },
  refreshButton: {
    backgroundColor: '#0891b2',
    margin: 20,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default DashboardScreen;
