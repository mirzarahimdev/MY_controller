import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { useProjects } from '../context/ProjectsContext';
import { ProjectType } from '../types/project';
import { getTypeLabel } from '../utils/status';

const TYPES: ProjectType[] = ['telegram_bot', 'website', 'mobile_app'];

export default function AddProjectScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { addProject, updateProject, getById } = useProjects();
  const editing = Boolean(id);
  const existing = id ? getById(id) : undefined;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [type, setType] = useState<ProjectType>('website');
  const [authHeaderName, setAuthHeaderName] = useState('Authorization');
  const [authToken, setAuthToken] = useState('');
  const [notifyOnDown, setNotifyOnDown] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!existing) return;
    setName(existing.name);
    setDescription(existing.description);
    setUrl(existing.url || '');
    setType(existing.type);
    setAuthHeaderName(existing.authHeaderName || 'Authorization');
    setNotifyOnDown(existing.notifyOnDown ?? true);
  }, [existing]);

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Xato', 'Loyiha nomini kiriting');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || 'Tavsif yo‘q',
        url: url.trim() || undefined,
        type,
        authHeaderName: authHeaderName.trim() || 'Authorization',
        authToken: authToken.trim() || (editing ? undefined : ''),
        notifyOnDown,
      };
      if (editing && id) {
        // Bo‘sh token = o‘zgartirilmagan; "-" yuborsa o‘chiradi
        if (authToken.trim() === '-') {
          await updateProject(id, { ...payload, authToken: '' });
        } else {
          await updateProject(id, payload);
        }
      } else {
        await addProject(payload);
      }
      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.hint}>
          {editing
            ? 'Loyihani yangilang. Tokenni o‘zgartirish uchun yangi qiymat yozing, o‘chirish uchun - yozing.'
            : 'Monitoring uchun nom, tur, URL va ixtiyoriy auth token kiriting.'}
        </Text>

        <Text style={styles.label}>Nomi</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Masalan: Support Bot"
          placeholderTextColor={colors.soft}
        />

        <Text style={styles.label}>Turi</Text>
        <View style={styles.types}>
          {TYPES.map((t) => {
            const active = type === t;
            return (
              <Pressable
                key={t}
                onPress={() => setType(t)}
                style={active ? styles.typeChipActive : styles.typeChip}
              >
                <Text style={active ? styles.typeTextActive : styles.typeText}>
                  {getTypeLabel(t)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.label}>URL / Health endpoint</Text>
        <TextInput
          style={styles.input}
          value={url}
          onChangeText={setUrl}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
          placeholder="https://..."
          placeholderTextColor={colors.soft}
        />

        <Text style={styles.label}>Auth header nomi</Text>
        <TextInput
          style={styles.input}
          value={authHeaderName}
          onChangeText={setAuthHeaderName}
          autoCapitalize="none"
          placeholder="Authorization"
          placeholderTextColor={colors.soft}
        />

        <Text style={styles.label}>
          Auth token {existing?.hasAuthToken ? '(saqlangan ✓)' : '(ixtiyoriy)'}
        </Text>
        <TextInput
          style={styles.input}
          value={authToken}
          onChangeText={setAuthToken}
          autoCapitalize="none"
          secureTextEntry
          placeholder={editing ? 'O‘zgartirish yoki - (o‘chirish)' : 'Bearer / API key'}
          placeholderTextColor={colors.soft}
        />

        <View style={styles.switchRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.switchTitle}>Offline ogohlantirish</Text>
            <Text style={styles.switchSub}>Tushganda bildirishnoma</Text>
          </View>
          <Switch
            value={notifyOnDown}
            onValueChange={setNotifyOnDown}
            trackColor={{ true: colors.accent, false: colors.line }}
          />
        </View>

        <Text style={styles.label}>Tavsif</Text>
        <TextInput
          style={styles.area}
          value={description}
          onChangeText={setDescription}
          multiline
          placeholder="Qisqa izoh"
          placeholderTextColor={colors.soft}
        />

        <Pressable
          style={saving ? styles.saveBusy : styles.save}
          onPress={onSave}
          disabled={saving}
        >
          <Text style={styles.saveText}>
            {saving ? 'Saqlanmoqda...' : editing ? 'Yangilash' : 'Saqlash'}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.md, paddingBottom: 40 },
  hint: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.soft,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
  },
  area: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 16,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
  },
  typeChipActive: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.accent,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  typeText: { color: colors.muted, fontWeight: '700', fontSize: 13 },
  typeTextActive: { color: '#fff', fontWeight: '700', fontSize: 13 },
  switchRow: {
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: radius.md,
    padding: 14,
  },
  switchTitle: { fontWeight: '700', color: colors.ink, fontSize: 15 },
  switchSub: { marginTop: 2, color: colors.muted, fontSize: 12 },
  save: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBusy: {
    marginTop: spacing.lg,
    backgroundColor: colors.accentDark,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveText: { color: '#fff', fontWeight: '800', fontSize: 16 },
});
