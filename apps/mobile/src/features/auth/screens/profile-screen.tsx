import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useProfileData } from '@/src/features/auth/hooks/use-profile-data';
import { useAuth } from '@/src/features/auth/context/auth-context';
import { apiFetch } from '@/src/infrastructure/api/client';
import type {
  ProfileAvatarUploadUrl,
  ProfileView,
} from '@/src/features/auth/types/profile';
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

const MAX_ALIAS_LENGTH = 120;
const MAX_BIO_LENGTH = 300;
type ProfileLanguage = 'en' | 'no';

function normalizeLanguage(language: string | null | undefined): ProfileLanguage {
  return language === 'no' ? 'no' : 'en';
}

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
  const { signOut } = useAuth();
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
  const [isEditing, setIsEditing] = useState(false);
  const [editAlias, setEditAlias] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [language, setLanguage] = useState<ProfileLanguage>('en');
  const [isSavingLanguage, setIsSavingLanguage] = useState(false);
  const [languageError, setLanguageError] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);

  const profileAlias = useMemo(() => {
    if (!profile) {
      return 'Diver';
    }

    return profile.alias?.trim() || profile.email?.split('@')[0] || 'Diver';
  }, [profile]);

  useEffect(() => {
    if (!profile) {
      return;
    }
    setLanguage(normalizeLanguage(profile.preferredLanguage));
  }, [profile]);

  function beginEdit(): void {
    if (!profile) {
      return;
    }

    setEditAlias(profile.alias ?? '');
    setEditBio(profile.bio ?? '');
    setEditAvatarUrl(profile.avatarUrl);
    setEditError(null);
    setIsEditing(true);
  }

  function cancelEdit(): void {
    setIsEditing(false);
    setEditError(null);
  }

  async function pickAvatar(): Promise<void> {
    setEditError(null);
    setIsUploadingAvatar(true);
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permission.status !== 'granted') {
        setEditError('Photo permission is required to update avatar.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.85,
        allowsEditing: false,
      });

      if (
        result.canceled ||
        !Array.isArray(result.assets) ||
        result.assets.length === 0
      ) {
        return;
      }

      const selectedAsset = result.assets.find(
        (asset) =>
          typeof asset.uri === 'string' && asset.uri.trim().length > 0,
      );

      if (!selectedAsset?.uri) {
        setEditError('Failed to read selected image.');
        return;
      }

      const mimeType = selectedAsset.mimeType ?? 'image/jpeg';
      const uploadTarget = await apiFetch<ProfileAvatarUploadUrl>(
        '/users/me/avatar/upload-url',
        {
          method: 'POST',
          body: JSON.stringify({ mimeType }),
        },
      );

      const assetResponse = await fetch(selectedAsset.uri);
      if (!assetResponse.ok) {
        throw new Error('Failed to read selected image.');
      }
      const assetBlob = await assetResponse.blob();

      const uploadResponse = await fetch(uploadTarget.uploadUrl, {
        method: 'PUT',
        headers: {
          'content-type': mimeType,
        },
        body: assetBlob,
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed: ${uploadResponse.status}`);
      }

      setEditAvatarUrl(uploadTarget.publicUrl);
    } catch (uploadError) {
      console.warn('Failed to upload avatar:', uploadError);
      setEditError('Failed to upload avatar. Please try again.');
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function saveEdit(): Promise<void> {
    if (!profile) {
      return;
    }

    const normalizedAlias = editAlias.trim();
    if (!normalizedAlias) {
      setEditError('Alias is required.');
      return;
    }
    if (normalizedAlias.length > MAX_ALIAS_LENGTH) {
      setEditError(`Alias must be ${MAX_ALIAS_LENGTH} characters or less.`);
      return;
    }
    if (editBio.length > MAX_BIO_LENGTH) {
      setEditError(`Bio must be ${MAX_BIO_LENGTH} characters or less.`);
      return;
    }

    setEditError(null);
    setIsSaving(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          alias: normalizedAlias,
          bio: editBio.trim() ? editBio.trim() : null,
          avatarUrl: editAvatarUrl,
        }),
      });

      await refresh();
      setIsEditing(false);
    } catch (saveError) {
      console.warn('Failed to save profile:', saveError);
      setEditError('Failed to save profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }

  async function selectLanguage(nextLanguage: ProfileLanguage): Promise<void> {
    if (!profile || isSavingLanguage) {
      return;
    }

    const previousLanguage = language;
    setLanguageError(null);
    setLanguage(nextLanguage);
    setIsSavingLanguage(true);
    try {
      await apiFetch('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({
          preferredLanguage: nextLanguage,
        }),
      });
      await refresh();
    } catch (updateError) {
      console.warn('Failed to update language:', updateError);
      setLanguage(previousLanguage);
      setLanguageError('Failed to update language. Please try again.');
    } finally {
      setIsSavingLanguage(false);
    }
  }

  async function handleLogout(): Promise<void> {
    if (isSigningOut) {
      return;
    }

    setLogoutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (signOutError) {
      console.warn('Failed to sign out:', signOutError);
      setLogoutError('Failed to log out. Please try again.');
    } finally {
      setIsSigningOut(false);
    }
  }

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
          {isEditing ? (
            <View>
              <View style={styles.editHeaderRow}>
                <Pressable
                  testID="profile-edit-avatar-button"
                  onPress={() => void pickAvatar()}
                  style={styles.editAvatarButton}
                >
                  {editAvatarUrl ? (
                    <Image source={{ uri: editAvatarUrl }} style={styles.editAvatarImage} />
                  ) : (
                    <View style={styles.editAvatarFallback}>
                      <Text style={styles.editAvatarFallbackText}>
                        {aliasInitials(editAlias, profile.email)}
                      </Text>
                    </View>
                  )}
                  <View style={styles.editAvatarOverlay}>
                    <Text style={styles.editAvatarOverlayText}>
                      {isUploadingAvatar ? '...' : 'Edit'}
                    </Text>
                  </View>
                </Pressable>

                {editAvatarUrl ? (
                  <Pressable
                    testID="profile-remove-avatar-button"
                    style={styles.removeAvatarButton}
                    onPress={() => setEditAvatarUrl(null)}
                  >
                    <Text style={styles.removeAvatarButtonText}>Remove</Text>
                  </Pressable>
                ) : null}
              </View>

              <TextInput
                testID="profile-edit-alias-input"
                value={editAlias}
                onChangeText={setEditAlias}
                placeholder="Alias"
                placeholderTextColor="rgba(245,245,244,0.35)"
                style={styles.editInput}
                maxLength={MAX_ALIAS_LENGTH}
                autoCapitalize="words"
              />

              <TextInput
                testID="profile-edit-bio-input"
                value={editBio}
                onChangeText={setEditBio}
                placeholder="Short bio..."
                placeholderTextColor="rgba(245,245,244,0.35)"
                style={[styles.editInput, styles.editBioInput]}
                multiline
                maxLength={MAX_BIO_LENGTH}
              />
              <Text testID="profile-edit-bio-count" style={styles.editBioCount}>
                {editBio.length}/{MAX_BIO_LENGTH}
              </Text>

              {editError ? (
                <Text testID="profile-edit-error" style={styles.editErrorText}>
                  {editError}
                </Text>
              ) : null}

              <View style={styles.editActions}>
                <Pressable
                  testID="profile-cancel-button"
                  style={styles.cancelButton}
                  onPress={cancelEdit}
                  disabled={isSaving}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </Pressable>
                <Pressable
                  testID="profile-save-button"
                  style={styles.saveButton}
                  onPress={() => void saveEdit()}
                  disabled={isSaving || isUploadingAvatar}
                >
                  <Text style={styles.saveButtonText}>
                    {isSaving ? 'Saving...' : 'Save'}
                  </Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View>
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

                <Pressable
                  testID="profile-edit-button"
                  style={styles.editButton}
                  onPress={beginEdit}
                >
                  <Text style={styles.editButtonText}>Edit</Text>
                </Pressable>
              </View>

              {profile.bio ? (
                <Text numberOfLines={3} style={styles.bioText}>
                  {profile.bio}
                </Text>
              ) : null}
            </View>
          )}
        </View>

        {!isEditing ? (
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
        ) : null}

        {!isEditing && view === 'menu' ? (
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
                value={language === 'no' ? 'Norsk' : 'English'}
                onPress={() => {
                  setLanguageError(null);
                  setView('language');
                }}
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
                label={isSigningOut ? 'Logging out...' : 'Log out'}
                destructive
                onPress={() => {
                  void handleLogout();
                }}
              />
              {logoutError ? (
                <Text testID="profile-logout-error" style={styles.menuErrorText}>
                  {logoutError}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}

        {!isEditing && view !== 'menu' ? (
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

            {view === 'language' ? (
              <View>
                <Text testID="profile-view-title" style={styles.detailTitle}>
                  Language
                </Text>
                <View style={styles.languageCard}>
                  {([
                    { value: 'en', label: 'English' },
                    { value: 'no', label: 'Norsk' },
                  ] as const).map((option) => (
                    <Pressable
                      key={option.value}
                      testID={`profile-language-option-${option.value}`}
                      accessibilityRole="button"
                      disabled={isSavingLanguage}
                      onPress={() => {
                        void selectLanguage(option.value);
                      }}
                      style={({ pressed }) => [
                        styles.languageOption,
                        pressed ? styles.rowPressed : null,
                      ]}
                    >
                      <Text style={styles.languageOptionLabel}>{option.label}</Text>
                      {language === option.value ? (
                        <Text
                          testID={`profile-language-check-${option.value}`}
                          style={styles.languageOptionCheck}
                        >
                          ✓
                        </Text>
                      ) : null}
                    </Pressable>
                  ))}
                </View>
                {languageError ? (
                  <Text testID="profile-language-error" style={styles.menuErrorText}>
                    {languageError}
                  </Text>
                ) : null}
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
  editHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 12,
  },
  editAvatarButton: {
    width: 84,
    height: 84,
    borderRadius: 42,
    overflow: 'hidden',
    position: 'relative',
  },
  editAvatarImage: {
    width: '100%',
    height: '100%',
  },
  editAvatarFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 42,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.42)',
    backgroundColor: 'rgba(16, 185, 129, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editAvatarFallbackText: {
    ...typography.h3,
    color: colors.primary[400],
    fontSize: 24,
  },
  editAvatarOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(12, 10, 9, 0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  editAvatarOverlayText: {
    ...typography.bodySmall,
    color: colors.neutral[50],
    fontSize: 11,
    fontWeight: '700',
  },
  removeAvatarButton: {
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  removeAvatarButtonText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.72)',
    fontWeight: '600',
  },
  editInput: {
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.2)',
    backgroundColor: 'rgba(28, 25, 23, 0.35)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.neutral[50],
    ...typography.body,
    marginBottom: 10,
  },
  editBioInput: {
    minHeight: 88,
    textAlignVertical: 'top',
  },
  editBioCount: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.52)',
    alignSelf: 'flex-end',
    marginTop: -4,
    marginBottom: 8,
  },
  editErrorText: {
    ...typography.bodySmall,
    color: '#fca5a5',
    marginBottom: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 2,
  },
  cancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,245,244,0.2)',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  cancelButtonText: {
    ...typography.bodySmall,
    color: 'rgba(245,245,244,0.72)',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: colors.primary[500],
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  saveButtonText: {
    ...typography.bodySmall,
    color: colors.neutral[50],
    fontWeight: '700',
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
  menuErrorText: {
    ...typography.bodySmall,
    color: '#dc2626',
    paddingHorizontal: 14,
    paddingVertical: 10,
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
  languageCard: {
    borderWidth: 1,
    borderColor: colors.neutral[200],
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: colors.neutral[50],
  },
  languageOption: {
    minHeight: 48,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.neutral[200],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageOptionLabel: {
    ...typography.body,
    color: colors.neutral[900],
    fontSize: 15,
  },
  languageOptionCheck: {
    ...typography.body,
    color: colors.primary[600],
    fontWeight: '700',
    fontSize: 16,
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
