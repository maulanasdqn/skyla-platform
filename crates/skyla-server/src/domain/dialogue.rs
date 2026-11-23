use skyla_types::{ChatMessage, Role};

#[derive(Clone, Debug, Default, PartialEq)]
pub struct Transcript {
    pub system: Option<String>,
    pub turns: Vec<(String, String)>,
}

pub struct Dialogue {
    pub history: Transcript,
    pub user: String,
}

fn clean(text: &str) -> String {
    text.trim().to_string()
}

impl Dialogue {
    pub fn parse(messages: &[ChatMessage], fallback_system: Option<&str>) -> Result<Self, String> {
        let (system, rest) = match messages.split_first() {
            Some((first, rest)) if first.role == Role::System => (Some(clean(&first.content)), rest),
            _ => (fallback_system.map(clean), messages),
        };
        let Some((last, earlier)) = rest.split_last() else {
            return Err("messages must end with a user message".into());
        };
        if last.role != Role::User || last.content.trim().is_empty() {
            return Err("messages must end with a non-empty user message".into());
        }
        if earlier.len() % 2 != 0 {
            return Err("messages must alternate user and assistant after the system message".into());
        }
        let mut turns = Vec::with_capacity(earlier.len() / 2);
        for pair in earlier.chunks(2) {
            if pair[0].role != Role::User || pair[1].role != Role::Assistant {
                return Err("messages must alternate user and assistant after the system message".into());
            }
            turns.push((clean(&pair[0].content), clean(&pair[1].content)));
        }
        Ok(Self {
            history: Transcript {
                system: system.filter(|s| !s.is_empty()),
                turns,
            },
            user: clean(&last.content),
        })
    }
}
