use crate::domain::{Dialogue, Transcript};
use anyhow::Result;
use skyla_chat::{seed_from_clock, Piece, Sampler, Session};
use skyla_types::{ServerMessage, Settings};
use tokio::sync::mpsc::UnboundedSender;

#[derive(Default)]
pub struct Conversation {
    held: Option<Transcript>,
}

impl Conversation {
    fn rebuild(&mut self, session: &mut Session, history: &Transcript) -> Result<bool> {
        if self.held.as_ref() == Some(history) {
            return Ok(true);
        }
        self.held = None;
        session.reset();
        let system = history.system.as_deref();
        for (user, assistant) in &history.turns {
            session.replay(user, system, assistant)?;
        }
        Ok(false)
    }

    pub fn chat(
        &mut self,
        session: &mut Session,
        dialogue: Dialogue,
        settings: &Settings,
        events: &UnboundedSender<ServerMessage>,
    ) {
        if events.send(ServerMessage::Started).is_err() {
            return;
        }
        let message = match self.reply(session, dialogue, settings, events) {
            Ok(stats) => ServerMessage::Done(stats),
            Err(e) => {
                self.held = None;
                ServerMessage::Error {
                    message: format!("{e:#}"),
                }
            }
        };
        let _ = events.send(message);
    }

    fn reply(
        &mut self,
        session: &mut Session,
        dialogue: Dialogue,
        settings: &Settings,
        events: &UnboundedSender<ServerMessage>,
    ) -> Result<skyla_types::Stats> {
        let Dialogue { mut history, user } = dialogue;
        let reused = self.rebuild(session, &history)?;
        println!(
            "chat: {} earlier turns, {}",
            history.turns.len(),
            if reused { "kv cache reused" } else { "history replayed" }
        );
        let mut sampler = Sampler::from_settings(settings, seed_from_clock());
        let mut answer = String::new();
        self.held = None;
        let emit = |piece: Piece| match piece {
            Piece::Text { text, thinking } => {
                if !thinking {
                    answer.push_str(&text);
                }
                events.send(ServerMessage::Token { text, thinking }).is_ok()
            }
            Piece::ThinkStart | Piece::ThinkEnd => true,
        };
        let stats = session.turn(
            &user,
            history.system.as_deref(),
            &mut sampler,
            settings.max_tokens,
            emit,
        )?;
        history.turns.push((user, answer.trim().to_string()));
        self.held = Some(history);
        Ok(stats)
    }
}
