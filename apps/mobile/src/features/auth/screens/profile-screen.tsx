import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfileData } from '@/src/features/auth/hooks/use-profile-data';
import type { ProfileView } from '@/src/features/auth/types/profile';
import { colors, typography } from '@/src/shared/theme';

function aliasInitials(alias: string | null, email: string | null): string {
  const fallback = (email ?? 'Diver').split('@')[0];
  const source = (alias ?? fallback).trim();
  if (!source) {
    return 'D';
  }

  return source
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function formatSince(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return 'Unknown';
  }

  return value.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric',
  });
}

function formatDate(iso: string): string {
  const value = new Date(iso);
  if (Number.isNaN(value.getTime())) {
    return 'Unknown date';
  }

  return value.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

const CURRENT_LABELS: Record<number, string> = {
  1: 'Calm',
  2: 'Light',
  3: 'Moderate',
  4: 'Strong',
  5: 'Very strong',
};

function ProfileRow({
  label,
  value,
  onPress,
  destructive = false,
  testID,
}: {
  label: string;
  value?: string;
  onPress: () => void;
  destructive?: boolean;
  testID: string;
}) {
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.rowButton, pressed ? styles.rowPressed : null]}
    >
      <Text style={[styles.rowLabel, destructive ? styles.rowLabelDestructive : null]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
        {!destructive ? <Text style={styles.rowChevron}>›</Text> : null}
      </View>
    </Pressable>
  );
}

function EmptyDetail({
  icon,
  label,
  testID,
}: {
  icon: string;
  label: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>{icon}</Text>
      <Text style={styles.emptyLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const {
    profile,
    stats,
    diveReports,
    createdSpots,
    favorites,
    isLoading,
    error,
    refresh,
  } = useProfileData();
  const [view, setView] = useState<ProfileView>('menu');

  const profileAlias = useMemo(() => {
    if (!profile) {
      return 'Diver';
    }

    return profile.alias?.trim() || profile.email?.split('@')[0] || 'Diver';
  }, [profile]);

  if (isLoading) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top + 24 }]}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  if (error || !profile || !stats) {
    return (
      <View style={[styles.loadingWrap, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.errorTitle}>Profile unavailable</Text>
        <Text style={styles.errorText}>{error ?? 'Failed to load profile data.'}</Text>
        <Pressable onPress={() => void refresh()} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View testID="profile-screen-root" style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(28, insets.bottom + 20) }]}
      >
        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.profileIdentityWrap}>
              {profile.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text testID="profile-avatar-initials" style={styles.avatarFallbackText}>
                    {aliasInitials(profile.alias, profile.email)}
                  </Text>
                </View>
              )}

              <View style={styles.identityTextWrap}>
                <Text testID="profile-header-alias" numberOfLines={1} style={styles.aliasText}>
                  {profileAlias}
                </Text>
                {profile.email ? <Text style={styles.emailText}>{profile.email}</Text> : null}
              </View>
            </View>

            <Pressable testID="profile-edit-button" style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit</Text>
            </Pressable>
          </View>

          {profile.bio ? (
            <Text numberOfLines={3} style={styles.bioText}>
              {profile.bio}
            </Text>
          ) : null}
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statCell}>
            <Text testID="profile-stats-total-reports" style={styles.statValue}>
              {stats.totalReports}
            </Text>
            <Text style={styles.statLabel}>Reports</Text>
          </View>
          <View style={styles.statCell}>
            <Text testID="profile-stats-unique-spots" style={styles.statValue}>
              {stats.uniqueSpotsDived}
            </Text>
            <Text style={styles.statLabel}>Spots</Text>
          </View>
          <View style={styles.statCell}>
            <Text testID="profile-stats-favorites" style={styles.statValue}>
              {stats.favoritesCount}
            </Text>
            <Text style={styles.statLabel}>Saved</Text>
          </View>
          <View style={styles.statCell}>
            <Text testID="profile-stats-member-since" style={styles.statValue}>
              {formatSince(stats.memberSince)}
            </Text>
            <Text style={styles.statLabel}>Since</Text>
          </View>
        </View>

        {view === 'menu' ? (
          <View>
            <Text style={styles.sectionLabel}>Activity</Text>
            <View style={styles.groupCard}>
              <ProfileRow
                testID="profile-row-reports"
                label="Dive Reports"
                value={String(diveReports.length)}
                onPress={() => setView('reports')}
              />
              <ProfileRow
                testID="profile-row-spots"
                label="My Spots"
                value={String(createdSpots.length)}
                onPress={() => setView('spots')}
              />
              <ProfileRow
                testID="profile-row-favorites"
                label="Saved Spots"
                value={String(favorites.length)}
                onPress={() => setView('favorites')}
              />
            </View>

            <Text style={styles.sectionLabel}>Account</Text>
            <View style={styles.groupCard}>
              <ProfileRow
                testID="profile-row-language"
                label="Language"
                value={profile.preferredLanguage === 'no' ? 'Norsk' : 'English'}
                onPress={() => {}}
              />
              <ProfileRow
                testID="profile-row-password"
                label="Password"
                onPress={() => {}}
              />
            </View>

            <Text style={styles.sectionLabel}>More</Text>
            <View style={styles.groupCard}>
              <ProfileRow
                testID="profile-row-legal"
                label="Legal"
                onPress={() => {}}
              />
              <ProfileRow
                testID="profile-row-logout"
                label="Log out"
                destructive
                onPress={() => {}}
              />
            </View>
          </View>
        ) : null}

        {view !== 'menu' ? (
          <View style={styles.detailWrap}>
            <Pressable
              testID="profile-back-button"
              style={styles.backButton}
              onPress={() => setView('menu')}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </Pressable>

            {view === 'reports' ? (
              <View>
                <Text testID="profile-view-title" style={styles.detailTitle}>
                  Dive Reports
                </Text>
                {diveReports.length === 0 ? (
                  <EmptyDetail
                    testID="profile-reports-empty"
                    icon="🤿"
                    label="No dive reports yet"
                  />
                ) : (
                  <View style={styles.cardsList}>
                    {diveReports.map((report, index) => (
                      <View
                        key={report.id}
                        testID={`profile-report-card-${index}`}
                        style={styles.reportCard}
                      >
                        <View style={styles.reportCardHeader}>
                          <Text numberOfLines={1} style={styles.reportSpotName}>
                            {report.spotName}
                          </Text>
                          <Text style={styles.reportDateText}>
                            {formatDate(report.date)}
                          </Text>
                        </View>
                        <View style={styles.reportMetaRow}>
                          <Text style={styles.reportMetaText}>
                            {report.visibilityMeters}m visibility
                          </Text>
                          <Text style={styles.reportMetaText}>•</Text>
                          <Text style={styles.reportMetaText}>
                            {CURRENT_LABELS[report.currentStrength] ?? 'Unknown'} current
                          </Text>
                        </View>
                        {report.notesPreview ? (
                          <Text numberOfLines={2} style={styles.reportNotes}>
                            {report.notesPreview}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {view === 'spots' ? (
              <View>
                <Text testID="profile-view-title" style={styles.detailTitle}>
                  My Spots
                </Text>
                {createdSpots.length === 0 ? (
                  <EmptyDetail
                    testID="profile-spots-empty"
                    icon="📍"
                    label="No spots created yet"
                  />
                ) : (
                  <View style={styles.cardsList}>
                    {createdSpots.map((spot, index) => (
                      <View
                        key={spot.id}
                        testID={`profile-created-spot-card-${index}`}
                        style={styles.spotCard}
                      >
                        <Text numberOfLines={1} style={styles.spotNameText}>
                          {spot.name}
                        </Text>
                        <Text style={styles.spotMetaText}>
                          Created {formatDate(spot.createdAt)}
                        </Text>
                        <Text style={styles.spotMetaText}>
                          {spot.reportCount} {spot.reportCount === 1 ? 'report' : 'reports'}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}

            {view === 'favorites' ? (
              <View>
                <Text testID="profile-view-title" style={styles.detailTitle}>
                  Saved Spots
                </Text>
                {favorites.length === 0 ? (
                  <EmptyDetail
                    testID="profile-favorites-empty"
                    icon="♥"
                    label="No saved spots yet"
                  />
                ) : (
                  <View style={styles.cardsList}>
                    {favorites.map((favorite, index) => (
                      <View
                        key={favorite.id}
                        testID={`profile-favorite-spot-card-${index}`}
                        style={styles.favoriteCard}
                      >
                        <Text numberOfLines={1} style={styles.favoriteSpotName}>
                          {favorite.spotName}
                        </Text>
                        <Text style={styles.favoriteMetaText}>
                          {favorite.latestVisibilityMeters === null
                            ? 'No reports'
                            : `${favorite.latestVisibilityMeters}m latest visibility`}
                        </Text>
                        {favorite.latestReportDate ? (
                          <Text style={styles.favoriteMetaText}>
                            Last report {formatDate(favorite.latestReportDate)}
                          </Text>
                        ) : null}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  scrollContent: {
    paddingHorizontal: 16,
  },
  header: {
    backgroundColor: colors.neutral[900],
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingBottom: 16,
    marginBottom: 12,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  profileIdentityWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
  },
  avatarFallback: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.42)',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallbackText: {
    ...typography.h3,
    color: colors.primary[400],
    fontSize: 24,
  },
  identityTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  aliasText: {
    ...typography.h2,
    color: colors.neutral[50],
    fontSize: 22,
  },
  emailText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.56)',
    marginTop: 2,
  },
  editButton: {
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 4,
  },
  editButtonText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.72)',
    fontWeight: '600',
  },
  bioText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.64)',
    marginTop: 12,
  },
  statsGrid: {
    backgroundColor: colors.neutral[50],
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.neutral[200],
    marginBottom: 14,
    flexDirection: 'row',
  },
  statCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.neutral[300],
  },
  statValue: {
    ...typography.h3,
    color: colors.neutral[900],
    fontSize: 17,
  },
  statLabel: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    marginTop: 2,
    fontSize: 11,
  },
  sectionLabel: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  groupCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.neutral[200],
    backgroundColor: colors.neutral[50],
  },
  rowButton: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
  },
  rowPressed: {
    backgroundColor: colors.neutral[100],
  },
  rowLabel: {
    ...typography.body,
    color: colors.neutral[900],
    fontSize: 15,
  },
  rowLabelDestructive: {
    color: '#dc2626',
  },
  rowRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  rowValue: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  rowChevron: {
    ...typography.body,
    color: colors.neutral[400],
    fontSize: 20,
    lineHeight: 20,
  },
  detailWrap: {
    marginTop: 12,
    backgroundColor: colors.neutral[50],
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 16,
    padding: 14,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  backButtonText: {
    ...typography.bodySmall,
    color: colors.primary[600],
    fontWeight: '600',
  },
  detailTitle: {
    ...typography.h3,
    color: colors.neutral[900],
    marginBottom: 6,
  },
  cardsList: {
    gap: 10,
    marginTop: 6,
  },
  reportCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  reportCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  reportSpotName: {
    ...typography.body,
    color: colors.neutral[900],
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  reportDateText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
    flexShrink: 0,
  },
  reportMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportMetaText: {
    ...typography.bodySmall,
    color: colors.neutral[600],
  },
  reportNotes: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  spotCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  spotNameText: {
    ...typography.body,
    color: colors.neutral[900],
    fontSize: 15,
    fontWeight: '600',
  },
  spotMetaText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  favoriteCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  favoriteSpotName: {
    ...typography.body,
    color: colors.neutral[900],
    fontSize: 15,
    fontWeight: '600',
  },
  favoriteMetaText: {
    ...typography.bodySmall,
    color: colors.neutral[500],
  },
  emptyWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 26,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
    color: colors.neutral[400],
  },
  emptyLabel: {
    ...typography.body,
    color: colors.neutral[500],
    fontSize: 15,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 12,
    backgroundColor: colors.neutral[100],
  },
  loadingText: {
    ...typography.body,
    color: colors.neutral[700],
  },
  errorTitle: {
    ...typography.h3,
    color: colors.neutral[900],
  },
  errorText: {
    ...typography.body,
    color: colors.neutral[600],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 4,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    ...typography.bodySmall,
    color: colors.neutral[50],
    fontWeight: '700',
  },
});
